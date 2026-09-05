import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/I18nProvider';
import { BottomNavigation, type BottomNavigationItem } from './BottomNavigation';

const items: readonly BottomNavigationItem[] = [
  { icon: 'dashboard', path: '/dashboard', titleKey: 'navigation.dashboard' },
  { icon: 'subscriptions', path: '/subscriptions', titleKey: 'navigation.subscriptions' },
  { icon: 'balance', path: '/balance', titleKey: 'navigation.balance' },
];

const setLocale = () => undefined;

function renderNav(current: string) {
  return render(
    <MemoryRouter initialEntries={[current]}>
      <I18nProvider locale="ru" setLocale={setLocale}>
        <BottomNavigation items={items} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.navDirection;
});

/** Направление нужно до начала перехода: по нему экран уезжает в нужную сторону. */
it('помечает переход вперёд, когда вкладка правее текущей', async () => {
  const user = userEvent.setup();
  renderNav('/dashboard');

  await user.click(screen.getByRole('link', { name: 'Баланс' }));

  expect(document.documentElement.dataset.navDirection).toBe('forward');
});

it('помечает переход назад, когда вкладка левее текущей', async () => {
  const user = userEvent.setup();
  renderNav('/balance');

  await user.click(screen.getByRole('link', { name: 'Главная' }));

  expect(document.documentElement.dataset.navDirection).toBe('back');
});

it('не задаёт направление при переходе на ту же вкладку', async () => {
  const user = userEvent.setup();
  renderNav('/dashboard');

  await user.click(screen.getByRole('link', { name: 'Главная' }));

  expect(document.documentElement.dataset.navDirection).toBeUndefined();
});

/** Иначе переход по ссылке внутри страницы унаследует направление от прошлого нажатия. */
it('снимает направление, когда переход закончился', async () => {
  const user = userEvent.setup();
  renderNav('/dashboard');

  await user.click(screen.getByRole('link', { name: 'Баланс' }));

  await waitFor(() => {
    expect(document.documentElement.dataset.navDirection).toBeUndefined();
  }, { timeout: 2_000 });
});
