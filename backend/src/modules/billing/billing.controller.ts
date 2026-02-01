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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Express request with rawBody (set when rawBody: true in NestFactory). */
interface RawBodyRequest extends ExpressRequest {
  rawBody?: Buffer;
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSubscription(@Request() req) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(@Body() body: { plan: string }, @Request() req) {
    return this.billingService.createCheckout(req.user.id, body.plan);
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
