import type { AppStateV2 } from './types';

export function createInitialState(): AppStateV2 {
  return {
    version: 2,
    preferences: { theme: 'dark', locale: 'ru', onboardingCompleted: false },
    session: { active: false },
    profile: {
      avatar: null,
      name: 'Алексей',
      username: '@sueta',
      role: 'Пользователь',
      email: '',
      emailVerified: false,
      registeredAt: '2026-08-11T00:00:00.000Z',
    },
    wallet: {
      balance: 790,
      transactions: [
        { id: 'transaction-subscription', type: 'purchase', amount: -250, tariffId: 'base', months: 1, date: '2026-08-01T09:30:00.000Z', status: 'completed' },
        { id: 'transaction-deposit', type: 'deposit', amount: 1000, paymentMethod: 'sbp', date: '2026-07-31T18:10:00.000Z', status: 'completed' },
      ],
    },
    subscription: {
      id: 'subscription-current',
      tariffId: 'base',
      status: 'active',
      daysLeft: 24,
      expiresAt: '2026-09-04T00:00:00.000Z',
      trafficUsed: 38.4,
      trafficLimit: 0,
      devicesUsed: 2,
      devicesLimit: 4,
      autoRenew: true,
    },
    devices: [
      { id: 'device-laptop', name: 'Ноутбук', platform: 'Windows', online: true, lastSeenAt: '2026-08-21T09:00:00.000Z' },
      { id: 'device-phone', name: 'Телефон', platform: 'Android', online: false, lastSeenAt: '2026-08-20T21:40:00.000Z' },
    ],
    purchaseDraft: { tariffId: 'base', months: 1 },
    referral: { rewardPercent: 20, invited: 8, active: 5, earned: 1480, telegramLink: 'https://t.me/suetavpn_bot' },
    tickets: [
      {
        id: 'ticket-current', subject: 'Как подключить устройство?', status: 'answered', createdAt: '2026-08-09T12:20:00.000Z', attachmentName: '',
        messages: [{ id: 'message-support', author: 'support', text: 'Откройте раздел подключения и выберите платформу.', date: '2026-08-09T12:25:00.000Z' }],
      },
    ],
    notifications: [],
    appliedPromos: [],
  };
}
