import { getTariff } from './tariffs';
import { createInitialState } from './state';
import type { AppStateV2, Device, Period, Subscription, TariffId, Ticket, TicketMessage, TicketNotification, Transaction } from './types';

export const STORAGE_KEY = 'suetavpn_app_v2';
export const LEGACY_STORAGE_KEY = 'suetavpn_mvp_v1';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parse(raw: unknown): RecordValue | null {
  if (isRecord(raw)) return raw;
  if (typeof raw !== 'string') return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function string(value: unknown, fallback: string, allowEmpty = false): string {
  return typeof value === 'string' && (allowEmpty || value.trim() !== '') ? value : fallback;
}

function canonicalDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function date(value: unknown, fallback: string): string {
  return canonicalDate(value) ?? canonicalDate(fallback) ?? new Date(0).toISOString();
}

function number(value: unknown, fallback: number, min = 0, integer = false): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && (!integer || Number.isInteger(value))
    ? value
    : fallback;
}

function tariffId(value: unknown, fallback: TariffId): TariffId {
  return value === 'base' || value === 'elite' ? value : fallback;
}

function period(value: unknown, fallback: Period): Period {
  return value === 1 || value === 3 || value === 6 || value === 12 ? value : fallback;
}

function normalizeTransaction(value: unknown): Transaction | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() ||
    (value.type !== 'deposit' && value.type !== 'promo' && value.type !== 'purchase') ||
    typeof value.amount !== 'number' || !Number.isFinite(value.amount) ||
    (value.description !== undefined && (typeof value.description !== 'string' || !value.description.trim()))) return null;
  const normalizedDate = canonicalDate(value.date);
  if (!normalizedDate) return null;
  return {
    id: value.id,
    type: value.type,
    amount: value.amount,
    ...(value.description === undefined ? {} : { description: value.description }),
    ...(value.paymentMethod === 'sbp' || value.paymentMethod === 'card' ? { paymentMethod: value.paymentMethod } : {}),
    ...(value.tariffId === 'base' || value.tariffId === 'elite' ? { tariffId: value.tariffId } : {}),
    ...(value.months === 1 || value.months === 3 || value.months === 6 || value.months === 12 ? { months: value.months } : {}),
    date: normalizedDate,
    status: 'completed',
  };
}

function normalizeMessage(value: unknown): TicketMessage | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() ||
    (value.author !== 'user' && value.author !== 'support') || typeof value.text !== 'string' || !value.text.trim()) return null;
  const normalizedDate = canonicalDate(value.date);
  if (!normalizedDate) return null;
  return { id: value.id, author: value.author, text: value.text, date: normalizedDate };
}

function normalizeTicket(value: unknown): Ticket | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.subject !== 'string' || !value.subject.trim() ||
    (value.status !== 'open' && value.status !== 'answered') || !Array.isArray(value.messages)) return null;
  const createdAt = canonicalDate(value.createdAt);
  if (!createdAt) return null;
  return {
    id: value.id, subject: value.subject, status: value.status, createdAt,
    attachmentName: string(value.attachmentName, '', true), messages: value.messages.map(normalizeMessage).filter((message): message is TicketMessage => message !== null),
  };
}

function normalizeNotification(value: unknown): TicketNotification | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() ||
    (value.type !== 'ticket-created' && value.type !== 'ticket-replied') || typeof value.ticketId !== 'string' || !value.ticketId.trim() ||
    typeof value.read !== 'boolean') return null;
  const createdAt = canonicalDate(value.createdAt);
  if (!createdAt) return null;
  const explicitReadAt = value.readAt;
  const normalizedReadAt = explicitReadAt === undefined || explicitReadAt === null
    ? null
    : canonicalDate(explicitReadAt);
  if (explicitReadAt !== undefined && explicitReadAt !== null && normalizedReadAt === null) return null;
  const readAt = normalizedReadAt
    ? normalizedReadAt
    : value.read
      ? createdAt
      : null;
  return {
    id: value.id,
    type: value.type,
    ticketId: value.ticketId,
    read: readAt !== null,
    readAt,
    createdAt,
  };
}

function normalizeCollection<T>(value: unknown, fallback: T[], normalize: (item: unknown) => T | null): T[] {
  return Array.isArray(value) ? value.map(normalize).filter((item): item is T => item !== null) : fallback;
}

/** Чужой origin в аватаре нам не нужен: принимаем только встроенную картинку или https-ссылку. */
function avatar(value: unknown, fallback: string | null): string | null {
  if (typeof value !== 'string' || !value.trim()) return value === null ? null : fallback;
  return /^data:image\/(png|jpeg|webp);base64,/.test(value) || /^https:\/\//.test(value) ? value : fallback;
}

function normalizeDevice(value: unknown): Device | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() ||
    typeof value.name !== 'string' || !value.name.trim() ||
    typeof value.platform !== 'string' || !value.platform.trim()) return null;
  const lastSeenAt = canonicalDate(value.lastSeenAt);
  if (!lastSeenAt) return null;
  return { id: value.id, name: value.name, platform: value.platform, online: value.online === true, lastSeenAt };
}

function normalizeSubscription(value: unknown, fallback: Subscription | null): Subscription | null {
  if (!isRecord(value)) return fallback;
  const id = string(value.id, fallback?.id ?? 'subscription-current');
  const selectedTariff = tariffId(value.tariffId, 'base');
  const tariff = getTariff(selectedTariff);
  if (!tariff) return fallback;
  return {
    id,
    tariffId: selectedTariff,
    status: value.status === 'expired' ? 'expired' : 'active',
    daysLeft: number(value.daysLeft, fallback?.daysLeft ?? 0, 0, true),
    expiresAt: date(value.expiresAt, fallback?.expiresAt ?? '2026-09-04T00:00:00.000Z'),
    trafficUsed: number(value.trafficUsed, fallback?.trafficUsed ?? 0),
    trafficLimit: tariff.traffic.kind === 'bypass' ? tariff.traffic.bypassGb : 0,
    devicesUsed: number(value.devicesUsed, fallback?.devicesUsed ?? 0, 0, true),
    devicesLimit: tariff.devices,
    autoRenew: typeof value.autoRenew === 'boolean' ? value.autoRenew : fallback?.autoRenew ?? true,
  };
}

function hydrateFromV2(raw: RecordValue, defaults: AppStateV2): AppStateV2 | null {
  if (raw.version !== 2) return null;
  const preferences = isRecord(raw.preferences) ? raw.preferences : {};
  const session = isRecord(raw.session) ? raw.session : {};
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const wallet = isRecord(raw.wallet) ? raw.wallet : {};
  const draft = isRecord(raw.purchaseDraft) ? raw.purchaseDraft : {};
  const referral = isRecord(raw.referral) ? raw.referral : {};
  return {
    version: 2,
    preferences: {
      theme: preferences.theme === 'light' ? 'light' : defaults.preferences.theme,
      locale: preferences.locale === 'en' ? 'en' : defaults.preferences.locale,
      onboardingCompleted: preferences.onboardingCompleted === true,
    },
    session: { active: session.active === true },
    profile: {
      avatar: avatar(profile.avatar, defaults.profile.avatar),
      name: string(profile.name, defaults.profile.name), username: string(profile.username, defaults.profile.username), role: string(profile.role, defaults.profile.role),
      email: string(profile.email, defaults.profile.email, true), emailVerified: profile.emailVerified === true, registeredAt: date(profile.registeredAt, defaults.profile.registeredAt),
    },
    wallet: { balance: number(wallet.balance, defaults.wallet.balance), transactions: normalizeCollection(wallet.transactions, defaults.wallet.transactions, normalizeTransaction) },
    subscription: raw.subscription === null ? null : normalizeSubscription(raw.subscription, defaults.subscription),
    devices: normalizeCollection(raw.devices, defaults.devices, normalizeDevice),
    purchaseDraft: { tariffId: tariffId(draft.tariffId, defaults.purchaseDraft.tariffId), months: period(draft.months, defaults.purchaseDraft.months) },
    referral: {
      rewardPercent: number(referral.rewardPercent, defaults.referral.rewardPercent), invited: number(referral.invited, defaults.referral.invited, 0, true),
      active: number(referral.active, defaults.referral.active, 0, true), earned: number(referral.earned, defaults.referral.earned),
      telegramLink: string(referral.telegramLink, defaults.referral.telegramLink),
    },
    tickets: normalizeCollection(raw.tickets, defaults.tickets, normalizeTicket),
    notifications: normalizeCollection(raw.notifications, defaults.notifications, normalizeNotification),
    appliedPromos: Array.isArray(raw.appliedPromos) ? raw.appliedPromos.filter((code): code is string => typeof code === 'string' && code === 'SUETA10') : [],
  };
}

function migrateV1(raw: RecordValue, defaults: AppStateV2): AppStateV2 | null {
  if (raw.version !== 1) return null;
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const referral = isRecord(raw.referral) ? raw.referral : {};
  const subscription = isRecord(raw.subscription) ? raw.subscription : null;
  return {
    ...defaults,
    preferences: { theme: raw.theme === 'light' ? 'light' : defaults.preferences.theme, locale: raw.locale === 'en' ? 'en' : defaults.preferences.locale, onboardingCompleted: raw.onboardingCompleted === true },
    session: { active: raw.sessionActive === true },
    profile: {
      avatar: avatar(profile.avatar, defaults.profile.avatar),
      name: string(profile.name, defaults.profile.name), username: string(profile.username, defaults.profile.username), role: string(profile.role, defaults.profile.role),
      email: string(profile.email, defaults.profile.email, true), emailVerified: profile.emailVerified === true, registeredAt: date(profile.registeredAt, defaults.profile.registeredAt),
    },
    wallet: { balance: number(raw.balance, defaults.wallet.balance), transactions: normalizeCollection(raw.transactions, defaults.wallet.transactions, normalizeTransaction) },
    subscription: normalizeSubscription(subscription, defaults.subscription),
    purchaseDraft: { tariffId: tariffId(raw.selectedTariffId, defaults.purchaseDraft.tariffId), months: period(raw.selectedMonths, defaults.purchaseDraft.months) },
    referral: {
      rewardPercent: number(referral.rewardPercent, defaults.referral.rewardPercent), invited: number(referral.invited, defaults.referral.invited, 0, true), active: number(referral.active, defaults.referral.active, 0, true),
      earned: number(referral.earned, defaults.referral.earned), telegramLink: string(referral.botLink, defaults.referral.telegramLink),
    },
    tickets: normalizeCollection(raw.tickets, defaults.tickets, normalizeTicket),
    notifications: [],
    appliedPromos: Array.isArray(raw.appliedPromos) ? raw.appliedPromos.filter((code): code is string => code === 'SUETA10') : [],
  };
}

export function hydrateState(rawV2: unknown, rawV1: unknown): AppStateV2 {
  const defaults = createInitialState();
  const v2 = parse(rawV2);
  const hydratedV2 = v2 && hydrateFromV2(v2, defaults);
  if (hydratedV2) return hydratedV2;
  const v1 = parse(rawV1);
  return (v1 && migrateV1(v1, defaults)) ?? defaults;
}
