export type Locale = 'ru' | 'en';
export type Theme = 'dark' | 'light';
export type TariffId = 'base' | 'elite';
export type Period = 1 | 3 | 6 | 12;

export interface Tariff {
  readonly id: TariffId;
  readonly devices: number;
  readonly locations: number;
  readonly speedGbps: number;
  readonly prices: Readonly<Record<Period, number>>;
  readonly traffic: Readonly<{ kind: 'unlimited' }> | Readonly<{ kind: 'bypass'; bypassGb: number }>;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'promo' | 'purchase';
  amount: number;
  description?: string;
  paymentMethod?: 'sbp' | 'card';
  tariffId?: TariffId;
  months?: Period;
  date: string;
  status: 'completed';
}

export interface TicketMessage {
  id: string;
  author: 'user' | 'support';
  text: string;
  date: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'answered';
  createdAt: string;
  attachmentName: string;
  messages: TicketMessage[];
}

export interface TicketNotification {
  id: string;
  type: 'ticket-created' | 'ticket-replied';
  ticketId: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Устройство, подключённое к подписке. Имя и платформу присылает клиент, поэтому это данные, а не строки перевода. */
export interface Device {
  id: string;
  name: string;
  platform: string;
  online: boolean;
  lastSeenAt: string;
}

export interface Subscription {
  id: string;
  tariffId: TariffId;
  status: 'active' | 'expired';
  daysLeft: number;
  expiresAt: string;
  trafficUsed: number;
  trafficLimit: number;
  devicesUsed: number;
  devicesLimit: number;
  autoRenew: boolean;
}

export interface AppStateV2 {
  version: 2;
  preferences: {
    theme: Theme;
    locale: Locale;
    onboardingCompleted: boolean;
  };
  session: {
    active: boolean;
  };
  profile: {
    /** Ссылка на картинку: data URL загруженного файла или photo_url из Telegram. */
    avatar: string | null;
    name: string;
    username: string;
    role: string;
    email: string;
    emailVerified: boolean;
    registeredAt: string;
  };
  wallet: {
    balance: number;
    transactions: Transaction[];
  };
  subscription: Subscription | null;
  devices: Device[];
  purchaseDraft: {
    tariffId: TariffId;
    months: Period;
  };
  referral: {
    rewardPercent: number;
    invited: number;
    active: number;
    earned: number;
    telegramLink: string;
  };
  tickets: Ticket[];
  notifications: TicketNotification[];
  appliedPromos: string[];
}

export type Result<T> =
  | { ok: true; state: T; code: 'success'; messageKey: string }
  | { ok: false; state: T; code: string; messageKey: string };
