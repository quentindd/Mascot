import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Express request with rawBody (set when rawBody: true in NestFactory). */
interface RawBodyRequest extends ExpressRequest {
  rawBody?: Buffer;
}

const CHECKOUT_SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment successful — Mascoty</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    h1 { color: #0f172a; font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>✅ Payment successful</h1>
    <p>Your credits have been added. You can close this window and return to Figma.</p>
  </div>
</body>
</html>`;

const CHECKOUT_CANCELLED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment cancelled — Mascoty</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    h1 { color: #0f172a; font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Payment cancelled</h1>
    <p>You can close this window and return to Figma to try again later.</p>
  </div>
</body>
</html>`;

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('checkout-success')
  @Header('Content-Type', 'text/html')
  @ApiExcludeEndpoint()
  getCheckoutSuccess() {
    return CHECKOUT_SUCCESS_HTML;
  }

  @Get('checkout-cancelled')
  @Header('Content-Type', 'text/html')
  @ApiExcludeEndpoint()
  getCheckoutCancelled() {
    return CHECKOUT_CANCELLED_HTML;
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSubscription(@Request() req) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Get('plans')
  getPlans() {
    return this.billingService.getPlansForClient();
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(@Body() body: { plan: string }, @Request() req) {
    return this.billingService.createCheckout(req.user.id, body.plan);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createPortalSession(@Request() req) {
    return this.billingService.createPortalSession(req.user.id);
  }

  @Post('webhook')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    const rawBody = req.rawBody ?? req.body;
    if (!rawBody) {
      throw new Error('Raw body is required for Stripe webhook verification');
    }
    const buffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    await this.billingService.handleWebhookEvent(signature, buffer);
  }
}
