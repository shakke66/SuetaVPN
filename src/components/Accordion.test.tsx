import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

const items = [
  { id: 'connection', title: 'Как подключиться?', content: 'Откройте инструкции.' },
  { id: 'payment', title: 'Как оплатить?', content: 'Пополните баланс.' },
] as const;

describe('Accordion', () => {
  it('renders matching accessible headers and keeps closed content mounted for motion', () => {
    const { container } = render(<Accordion items={items} defaultOpenIds={['connection']} />);

    const headers = container.querySelectorAll('.accordion__item > .accordion__header');
    expect(headers).toHaveLength(2);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.className === 'accordion__trigger')).toBe(true);

    for (const button of buttons) {
      const controls = button.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls ?? '')).toHaveAttribute('role', 'region');
      expect(document.getElementById(controls ?? '')).not.toHaveAttribute('hidden');
    }

    expect(screen.getByRole('button', { name: 'Как подключиться?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Как оплатить?' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Пополните баланс.')).toBeInTheDocument();
  });

  it('allows multiple items to stay open and toggles with native keyboard activation', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} defaultOpenIds={['connection']} ariaLabel="Ответы" />);

    const accordion = screen.getByRole('group', { name: 'Ответы' });
    const connection = within(accordion).getByRole('button', { name: 'Как подключиться?' });
    const payment = within(accordion).getByRole('button', { name: 'Как оплатить?' });

    payment.focus();
    await user.keyboard('{Enter}');
    expect(connection).toHaveAttribute('aria-expanded', 'true');
    expect(payment).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard(' ');
    expect(connection).toHaveAttribute('aria-expanded', 'true');
    expect(payment).toHaveAttribute('aria-expanded', 'false');
  });
});
