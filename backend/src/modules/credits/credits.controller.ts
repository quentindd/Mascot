import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  getBalance(@Request() req) {
    return this.creditsService.getBalance(req.user.id);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add credits to current user (for testing)' })
  async addCredits(
    @Request() req,
    @Body() body: { amount: number; description?: string },
  ) {
    // For now, allow users to add credits to themselves (for testing)
    // In production, this should be admin-only
    await this.creditsService.addCredits(
      req.user.id,
      body.amount,
      body.description || `Added ${body.amount} credits via API`,
    );
    return { success: true, message: `Added ${body.amount} credits` };
  }
}
