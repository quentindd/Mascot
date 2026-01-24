import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async getSubscription(userId: string) {
    // TODO: Implement Stripe integration
    return {
      plan: 'free',
      status: 'active',
    };
  }

  async createCheckout(userId: string, plan: string) {
    // TODO: Implement Stripe checkout session creation
    return {
      checkoutUrl: 'https://checkout.stripe.com/...',
    };
  }
}
