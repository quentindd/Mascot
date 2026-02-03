import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../../entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { CreditTransactionType } from '../../entities/credit-ledger.entity';

/** Subscription plans: Basic $4.99/30 cr, Pro $7.99/65 cr, Max $9.99/100 cr. Price IDs from env. */
export const SUBSCRIPTION_PLAN_IDS = ['basic', 'pro', 'max'] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  credits: number;
  amountCents: number;
  priceId: string | null; // Stripe Price ID (recurring), set via STRIPE_PRICE_BASIC etc.
}

function buildPlans(config: ConfigService): Record<SubscriptionPlanId, SubscriptionPlan> {
  return {
    basic: {
      id: 'basic',
      credits: 30,
      amountCents: 499,
      priceId: config.get<string>('STRIPE_PRICE_BASIC') ?? null,
    },
    pro: {
      id: 'pro',
      credits: 65,
      amountCents: 799,
      priceId: config.get<string>('STRIPE_PRICE_PRO') ?? null,
    },
    max: {
      id: 'max',
      credits: 100,
      amountCents: 999,
      priceId: config.get<string>('STRIPE_PRICE_MAX') ?? null,
    },
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;
  private readonly plans: Record<SubscriptionPlanId, SubscriptionPlan>;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private creditsService: CreditsService,
  ) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
    }
    this.plans = buildPlans(configService);
  }

  getPlans(): Record<SubscriptionPlanId, SubscriptionPlan> {
    return this.plans;
  }

  getCreditsForPriceId(priceId: string): number | null {
    for (const plan of Object.values(this.plans)) {
      if (plan.priceId === priceId) return plan.credits;
    }
    return null;
  }

  async getSubscription(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { plan: 'free', status: 'active' as const };
    return {
      plan: user.plan,
      status: user.stripeSubscriptionId ? 'active' : 'active',
      stripeSubscriptionId: user.stripeSubscriptionId ?? undefined,
      creditsLastResetAt: user.creditsLastResetAt ?? undefined,
    };
  }

  /**
   * Create a Stripe Checkout session for a subscription plan.
   * Plan must be "basic" | "pro" | "max". Requires STRIPE_PRICE_* to be set.
   */
  async createCheckout(userId: string, plan: string): Promise<{ checkoutUrl: string }> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
      );
    }

    const planId = plan.toLowerCase() as SubscriptionPlanId;
    const subscriptionPlan = this.plans[planId];
    if (!subscriptionPlan || !SUBSCRIPTION_PLAN_IDS.includes(planId)) {
      throw new BadRequestException(
        `Invalid plan. Use one of: ${SUBSCRIPTION_PLAN_IDS.join(', ')}`,
      );
    }
    if (!subscriptionPlan.priceId) {
      throw new BadRequestException(
        `Stripe Price ID for plan "${planId}" is not set. Set STRIPE_PRICE_${planId.toUpperCase()} in your environment.`,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://mascoty-production.up.railway.app';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: subscriptionPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
      client_reference_id: userId,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
        trial_period_days: undefined,
      },
    };

    // If user already has a Stripe customer ID, reuse it so the portal shows one customer
    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email ?? undefined;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { checkoutUrl: session.url };
  }

  /**
   * Create a Stripe Customer Portal session so the user can manage subscription, payment method, or cancel.
   * User must have subscribed at least once (have stripeCustomerId).
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Billing is not configured. Set STRIPE_SECRET_KEY.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.stripeCustomerId) {
      throw new BadRequestException(
        'No billing account yet. Subscribe once to manage your subscription or cancel it from here.',
      );
    }

    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://mascoty-production.up.railway.app';

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: baseUrl,
    });

    if (!portalSession.url) {
      throw new BadRequestException('Failed to create billing portal session');
    }

    return { url: portalSession.url };
  }

  /**
   * Handle Stripe webhooks: invoice.paid (grant credits), checkout.session.completed (link subscription to user).
   */
  async handleWebhookEvent(signature: string, rawBody: Buffer): Promise<void> {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret || !this.stripe) {
      throw new BadRequestException('Stripe webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook signature verification failed: ${message}`);
    }

    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          await this.handleCheckoutSubscriptionCompleted(session);
        }
        break;
      }
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) {
      this.logger.warn('[Stripe] invoice.paid: no subscription on invoice');
      return;
    }

    const subscription = await this.stripe!.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.warn('[Stripe] invoice.paid: no userId in subscription metadata');
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`[Stripe] invoice.paid: user not found ${userId}`);
      return;
    }

    user.stripeCustomerId = subscription.customer as string;
    user.stripeSubscriptionId = subscription.id;
    user.stripeSubscriptionMetadata = { planId: subscription.metadata?.planId ?? null };
    await this.userRepository.save(user);

    const line = invoice.lines?.data?.[0];
    const priceId = line?.price?.id;
    if (!priceId) {
      this.logger.warn('[Stripe] invoice.paid: no price on first line');
      return;
    }

    const credits = this.getCreditsForPriceId(priceId);
    if (credits == null || credits <= 0) {
      this.logger.warn(`[Stripe] invoice.paid: unknown price id ${priceId}`);
      return;
    }

    await this.creditsService.addCredits(
      userId,
      credits,
      `Stripe subscription: ${credits} credits (invoice ${invoice.id})`,
      invoice.id,
      CreditTransactionType.SUBSCRIPTION_GRANT,
    );
    this.logger.log(`Credits granted: userId=${userId} credits=${credits} invoice=${invoice.id}`);
  }

  /** Plans for client (no Stripe price IDs). */
  getPlansForClient(): { id: string; credits: number; amountCents: number; priceLabel: string }[] {
    const labels: Record<SubscriptionPlanId, string> = {
      basic: '$4.99',
      pro: '$7.99',
      max: '$9.99',
    };
    return SUBSCRIPTION_PLAN_IDS.map((id) => ({
      id,
      credits: this.plans[id].credits,
      amountCents: this.plans[id].amountCents,
      priceLabel: labels[id],
    }));
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.stripeSubscriptionId !== subscription.id) return;

    user.stripeSubscriptionId = null;
    user.stripeSubscriptionMetadata = null;
    await this.userRepository.save(user);
    this.logger.log(`Subscription cleared for user ${userId}`);
  }

  private async handleCheckoutSubscriptionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (!userId) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    if (session.customer && !user.stripeCustomerId) {
      user.stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
    }
    if (session.subscription && !user.stripeSubscriptionId) {
      user.stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    }
    await this.userRepository.save(user);
  }
}
