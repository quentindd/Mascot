import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  getSubscription(@Request() req) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Post('checkout')
  createCheckout(@Body() body: { plan: string }, @Request() req) {
    return this.billingService.createCheckout(req.user.id, body.plan);
  }
}
