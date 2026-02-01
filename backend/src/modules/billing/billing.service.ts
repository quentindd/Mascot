import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../../entities/user.entity';
import { CreditsService } from '../credits/credits.service';

/** Credit pack: credits amount → price in USD (Stripe amount in cents). */
export const CREDIT_PACKS: Record<string, { credits: number; amountCents: number }> = {
  '25': { credits: 25, amountCents: 599 },
  '75': { credits: 75, amountCents: 1299 },
  '200': { credits: 200, amountCents: 2599 },
};

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

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
  }

  async getSubscription(userId: string) {
    return {
      plan: 'free',
      status: 'active',
    };
  }

  /**
   * Create a Stripe Checkout session for a credit pack.
   * Plan must be "25" | "75" | "200" (credits).
   */
  async createCheckout(userId: string, plan: string): Promise<{ checkoutUrl: string }> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
      );
    }

    const pack = CREDIT_PACKS[plan];
    if (!pack) {
      throw new BadRequestException(
        `Invalid plan. Use one of: ${Object.keys(CREDIT_PACKS).join(', ')}`,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://mascot-production.up.railway.app';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pack.amountCents,
            product_data: {
              name: `Mascot — ${pack.credits} credits`,
              description: `One-time purchase of ${pack.credits} credits for mascot, poses, animations, and logos.`,
              images: undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
      client_reference_id: userId,
      metadata: {
        userId,
        credits: String(pack.credits),
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { checkoutUrl: session.url };
  }

  /**
   * Handle Stripe webhook (checkout.session.completed): add credits to user.
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

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const creditsStr = session.metadata?.credits;

    if (!userId || !creditsStr) {
      throw new BadRequestException('Missing userId or credits in session metadata');
    }

    const credits = parseInt(creditsStr, 10);
    if (Number.isNaN(credits) || credits <= 0) {
      throw new BadRequestException('Invalid credits in metadata');
    }

    await this.creditsService.addCredits(
      userId,
      credits,
      `Stripe purchase: ${credits} credits (session ${session.id})`,
    );
  }
}
