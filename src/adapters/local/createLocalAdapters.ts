import type {
  EmailChallenge,
  LocalAdapters,
  StartEmailResult,
  TelegramUser,
} from '../contracts';
import type { AppStateV2, Result } from '../../domain/types';
import {
  applyPromo,
  createTicket,
  markAllNotificationsRead,
  markNotificationRead,
  purchaseSubscription,
  replyToTicket,
  topUp,
  type OperationIdSource,
} from '../../domain/operations';

const DEFAULT_DELAY_MS = 250;
const EMAIL_CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;

export interface LocalAdapterOptions {
  delayMs?: number;
  now?: () => string;
  idSource?: OperationIdSource;
  verificationCodeSource?: () => string;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function failure(
  state: AppStateV2,
  code: string,
  messageKey: string,
): Extract<Result<AppStateV2>, { ok: false }> {
  return { ok: false, state, code, messageKey };
}

function success(state: AppStateV2, messageKey: string): Result<AppStateV2> {
  return { ok: true, state, code: 'success', messageKey };
}

function generateVerificationCode(): string {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return String(value[0] % 1_000_000).padStart(6, '0');
}

function isTelegramUser(value: unknown): value is TelegramUser {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'number' && Number.isFinite(user.id)
    && (user.first_name === undefined || typeof user.first_name === 'string')
    && (user.last_name === undefined || typeof user.last_name === 'string')
    && (user.username === undefined || typeof user.username === 'string')
    && (user.photo_url === undefined || typeof user.photo_url === 'string');
}

function detectTelegramUser(): TelegramUser | null {
  const telegramWindow = window as unknown as {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: unknown } } };
  };
  const user = telegramWindow.Telegram?.WebApp?.initDataUnsafe?.user;
  return isTelegramUser(user) ? user : null;
}

function telegramProfile(state: AppStateV2, user: TelegramUser | null): AppStateV2['profile'] {
  if (!user) return state.profile;
  const name = [user.first_name, user.last_name]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ');
  const username = user.username?.trim();
  const photo = user.photo_url?.trim();
  return {
    ...state.profile,
    // Фото из Telegram подставляем только на пустое место: своё пользователь ставил сам.
    avatar: state.profile.avatar ?? (photo && /^https:\/\//.test(photo) ? photo : null),
    name: name || username || state.profile.name,
    username: username ? `@${username.replace(/^@/, '')}` : state.profile.username,
  };
}

export function createLocalAdapters(options: LocalAdapterOptions = {}): LocalAdapters {
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const now = options.now ?? (() => new Date().toISOString());
  const verificationCodeSource = options.verificationCodeSource ?? generateVerificationCode;
  const run = async <T>(operation: () => T): Promise<T> => {
    await delay(delayMs);
    return operation();
  };

  return {
    auth: {
      startEmail: (state, email) => run<StartEmailResult>(() => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
          return failure(state, 'EMAIL_REQUIRED', 'auth.validation.emailRequired');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return failure(state, 'EMAIL_INVALID', 'auth.validation.emailInvalid');
        }

        const issuedAt = Date.parse(now());
        const challenge: EmailChallenge = {
          email: normalizedEmail,
          code: verificationCodeSource(),
          expiresAt: new Date(issuedAt + EMAIL_CHALLENGE_LIFETIME_MS).toISOString(),
        };
        return {
          ok: true,
          state,
          code: 'success',
          messageKey: 'auth.email.localVerification.title',
          challenge,
        };
      }),
      verifyEmail: (state, challenge, code) => run(() => {
        const normalizedCode = code.trim();
        if (!normalizedCode) {
          return failure(state, 'CODE_REQUIRED', 'auth.validation.codeRequired');
        }
        if (!/^\d{6}$/.test(normalizedCode)) {
          return failure(state, 'CODE_INVALID', 'auth.validation.codeInvalid');
        }
        if (!challenge) {
          return failure(state, 'CODE_WRONG', 'auth.validation.codeWrong');
        }
        if (Date.parse(now()) >= Date.parse(challenge.expiresAt)) {
          return failure(state, 'CODE_EXPIRED', 'auth.validation.codeExpired');
        }
        if (normalizedCode !== challenge.code) {
          return failure(state, 'CODE_WRONG', 'auth.validation.codeWrong');
        }
        return success({
          ...state,
          session: { active: true },
          profile: {
            ...state.profile,
            email: challenge.email,
            emailVerified: true,
          },
        }, 'auth.email.success');
      }),
      loginTelegram: (state, user) => run(() => success({
        ...state,
        session: { active: true },
        profile: telegramProfile(state, user),
      }, 'auth.telegram.success')),
      logout: (state) => run(() => success({
        ...state,
        session: { active: false },
      }, 'auth.actions.logout')),
      detectTelegramUser,
    },
    billing: {
      topUp: (state, request) => run(() => topUp(state, request, now(), options.idSource)),
      applyPromo: (state, code) => run(() => applyPromo(state, code, now(), options.idSource)),
    },
    subscriptions: {
      purchase: (state, tariffId, months) => run(() => (
        purchaseSubscription(state, tariffId, months, now(), options.idSource)
      )),
    },
    tickets: {
      create: (state, request) => run(() => createTicket(state, request, now(), options.idSource)),
      reply: (state, ticketId, message) => run(() => (
        replyToTicket(state, ticketId, message, now(), options.idSource)
      )),
    },
    notifications: {
      markRead: (state, notificationId) => run(() => markNotificationRead(state, notificationId, now())),
      markAllRead: (state) => run(() => markAllNotificationsRead(state, now())),
    },
  };
}
