export type Locale = 'ru' | 'en';
export type Theme = 'dark' | 'light';
export type TariffId = 'base' | 'elite';
export type Period = 1 | 3 | 6 | 12;

export interface Tariff {
  id: TariffId;
  devices: number;
  locations: number;
  speedGbps: number;
  prices: Readonly<Record<Period, number>>;
  traffic: { kind: 'unlimited' } | { kind: 'bypass'; bypassGb: number };
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'promo' | 'purchase';
  amount: number;
  description: string;
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
  createdAt: string;
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
