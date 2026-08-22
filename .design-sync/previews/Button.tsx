import { Button, Icon } from 'suetavpn';

const row: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
};

/** Четыре варианта кнопки в порядке убывания акцента. */
export const Variants = () => (
  <div style={row}>
    <Button variant="primary">Оформить подписку</Button>
    <Button variant="ghost">Управлять подпиской</Button>
    <Button variant="utility">Применить</Button>
    <Button variant="danger">
      <Icon name="logout" />
      <span>Выйти</span>
    </Button>
  </div>
);

/** Квадратные кнопки-иконки из шапки кабинета. */
export const IconOnly = () => (
  <div style={row}>
    <Button aria-label="Включить светлую тему" iconOnly variant="utility">
      <Icon name="sun" />
    </Button>
    <Button aria-label="Открыть уведомления" iconOnly variant="utility">
      <Icon name="bell" />
    </Button>
    <Button aria-label="Открыть меню" iconOnly variant="utility">
      <Icon name="menu" />
    </Button>
    <Button aria-label="Закрыть" iconOnly variant="ghost">
      <Icon name="close" />
    </Button>
  </div>
);

/** Недоступное и выполняющееся состояния. */
export const States = () => (
  <div style={row}>
    <Button disabled variant="primary">Пополнить на 100 ₽</Button>
    <Button aria-busy disabled variant="ghost">Открываем Telegram</Button>
    <Button disabled variant="utility">Применить</Button>
  </div>
);
