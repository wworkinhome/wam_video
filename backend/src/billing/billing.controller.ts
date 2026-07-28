import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SyncCheckoutDto } from './dto/sync-checkout.dto';
import type { WompiWebhookPayload } from './wompi.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  listPlans(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.listPlans(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.getMySubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  listInvoices(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.listMyInvoices(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto) {
    return this.billing.createCheckout(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/sync')
  syncCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: SyncCheckoutDto) {
    return this.billing.syncFromRedirect(user.id, dto);
  }

  // Público — lo llama Wompi directamente. Se autentica por firma (checksum), no por JWT.
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() payload: WompiWebhookPayload) {
    return this.billing.handleWebhookEvent(payload);
  }
}
