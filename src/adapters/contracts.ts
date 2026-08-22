import type { CreateTicketRequest, TopUpRequest } from '../domain/operations';
import type { AppStateV2, Period, Result, TariffId } from '../domain/types';

export interface EmailChallenge {
  readonly email: string;
  readonly code: string;
  readonly expiresAt: string;
}

export interface TelegramUser {
  readonly id: number;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly username?: string;
  readonly photo_url?: string;
}

type AuthFailure = Extract<Result<AppStateV2>, { ok: false }>;

export type StartEmailResult =
  | {
      ok: true;
      state: AppStateV2;
      code: 'success';
      messageKey: string;
      challenge: EmailChallenge;
    }
  | AuthFailure;

export interface AuthAdapter {
  startEmail(state: AppStateV2, email: string): Promise<StartEmailResult>;
  verifyEmail(
    state: AppStateV2,
    challenge: EmailChallenge | null,
    code: string,
  ): Promise<Result<AppStateV2>>;
  loginTelegram(state: AppStateV2, user: TelegramUser | null): Promise<Result<AppStateV2>>;
  logout(state: AppStateV2): Promise<Result<AppStateV2>>;
  detectTelegramUser(): TelegramUser | null;
}

export interface BillingAdapter {
  topUp(state: AppStateV2, request: TopUpRequest): Promise<Result<AppStateV2>>;
  applyPromo(state: AppStateV2, code: string): Promise<Result<AppStateV2>>;
}

export interface SubscriptionAdapter {
  purchase(state: AppStateV2, tariffId: TariffId, months: Period): Promise<Result<AppStateV2>>;
}

export interface TicketAdapter {
  create(state: AppStateV2, request: CreateTicketRequest): Promise<Result<AppStateV2>>;
  reply(state: AppStateV2, ticketId: string, message: string): Promise<Result<AppStateV2>>;
}

export interface NotificationAdapter {
  markRead(state: AppStateV2, notificationId: string): Promise<Result<AppStateV2>>;
  markAllRead(state: AppStateV2): Promise<Result<AppStateV2>>;
}

export interface LocalAdapters {
  auth: AuthAdapter;
  billing: BillingAdapter;
  subscriptions: SubscriptionAdapter;
  tickets: TicketAdapter;
  notifications: NotificationAdapter;
}
