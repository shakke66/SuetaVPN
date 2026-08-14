import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from 'react';
import type { Locale } from '../domain/types';
import { I18nProvider, useI18n } from './I18nProvider';
import { en, getMessage, ru, type MessageKey } from './messages';

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((result, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') result[path] = child;
    else Object.assign(result, flatten(child as object, path));
    return result;
  }, {});
}

const representativeKeys = [
  'app.name',
  'common.actions.save',
  'common.status.active',
  'accessibility.skipToContent',
  'auth.tabs.login',
  'auth.telegram.continue',
  'auth.email.localVerification.title',
  'auth.validation.codeExpired',
  'navigation.dashboard',
  'shell.theme.switchToLight',
  'shell.notifications.markAllRead',
  'landing.header.signIn',
  'landing.hero.title',
  'landing.trust.title',
  'landing.features.title',
  'landing.tariffs.title',
  'landing.steps.title',
  'landing.value.title',
  'landing.reviews.title',
  'landing.faq.title',
  'landing.footer.privacy',
  'tariffs.base.name',
  'tariffs.elite.name',
  'dashboard.title',
  'subscriptions.title',
  'connectDialog.title',
  'purchase.summary.title',
  'purchase.errors.insufficientBalance',
  'balance.promo.title',
  'balance.topUp.title',
  'balance.history.title',
  'referrals.stats.earned',
  'referrals.telegram.share',
  'support.tickets.title',
  'support.create.subjectLabel',
  'support.reply.messageLabel',
  'ticketNotifications.ticketCreated',
  'info.tabs.faq',
  'info.tabs.agreement',
  'info.tabs.privacy',
  'profile.title',
  'onboarding.actions.next',
  'validation.required',
  'toast.dismiss',
] as const satisfies readonly MessageKey[];

const domainResultKeys = [
  'billing.topUp.success',
  'billing.topUp.amountInvalid',
  'billing.topUp.amountTooLow',
  'billing.topUp.amountTooHigh',
  'billing.topUp.paymentMethodInvalid',
  'billing.promo.success',
  'billing.promo.notFound',
  'billing.promo.alreadyUsed',
  'subscriptions.purchase.success',
  'subscriptions.purchase.tariffNotFound',
  'subscriptions.purchase.periodNotSupported',
  'subscriptions.purchase.insufficientBalance',
  'tickets.create.success',
  'tickets.create.subjectRequired',
  'tickets.create.messageRequired',
  'tickets.reply.success',
  'tickets.reply.messageRequired',
  'tickets.reply.notFound',
  'notifications.markRead.success',
  'notifications.markRead.notFound',
  'notifications.markAllRead.success',
] as const satisfies readonly MessageKey[];

function Probe() {
  const { locale, t, formatMoney, formatDate, setLocale } = useI18n();
  return createElement(
    'div',
    null,
    createElement('output', { 'data-testid': 'locale' }, locale),
    createElement('output', { 'data-testid': 'money' }, formatMoney(1234)),
    createElement('output', { 'data-testid': 'date' }, formatDate('2026-08-13T00:00:00.000Z')),
    createElement('output', { 'data-testid': 'welcome' }, t('app.welcome', { name: 'Mira' })),
    createElement(
      'button',
      { type: 'button', onClick: () => setLocale(locale === 'ru' ? 'en' : 'ru') },
      'switch',
    ),
  );
}

function Harness({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState(initialLocale);
  return createElement(
    I18nProvider,
    { locale, setLocale, children: createElement(Probe) },
  );
}

describe('localized message catalog', () => {
  it('keeps both locale trees complete, non-empty and free of prohibited wording', () => {
    const flattenedRu = flatten(ru);
    const flattenedEn = flatten(en);

    expect(Object.keys(flattenedEn).sort()).toEqual(Object.keys(flattenedRu).sort());
    const allMessages = [...Object.values(flattenedRu), ...Object.values(flattenedEn)];
    expect(allMessages.every((value) => value.trim().length > 0)).toBe(true);
    expect(allMessages.join('\n')).not.toMatch(/\bdemos?\b|demonstrat|демо|демонстрацион/iu);
  });

  it('provides copy for every planned public and cabinet surface', () => {
    for (const key of [...representativeKeys, ...domainResultKeys]) {
      expect(getMessage('ru', key), `missing RU message ${key}`).not.toBe(key);
      expect(getMessage('en', key), `missing EN message ${key}`).not.toBe(key);
    }
  });

  it('interpolates real name and amount templates', () => {
    expect(getMessage('ru', 'app.welcome', { name: 'Мира' })).toBe('Добро пожаловать, Мира!');
    expect(getMessage('en', 'billing.topUp.success', { amount: 'RUB 500' })).toBe('Balance topped up by RUB 500');
  });
});

describe('I18nProvider', () => {
  it('formats RU money/date and updates html.lang', async () => {
    render(createElement(Harness, { initialLocale: 'ru' }));

    await waitFor(() => expect(document.documentElement.lang).toBe('ru'));
    expect(screen.getByTestId('money').textContent).toBe('1 234 ₽');
    expect(screen.getByTestId('date')).toHaveTextContent('13 августа 2026 г.');
  });

  it('switches in place to EN formatting and translations', async () => {
    const user = userEvent.setup();
    render(createElement(Harness, { initialLocale: 'ru' }));

    await user.click(screen.getByRole('button', { name: 'switch' }));

    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    expect(screen.getByTestId('money').textContent).toBe('RUB 1,234');
    expect(screen.getByTestId('date')).toHaveTextContent('August 13, 2026');
    expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome, Mira!');
  });
});
