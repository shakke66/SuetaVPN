import { useRef } from 'react';
import { Brand, Button, Drawer, Icon, LanguageMenu } from 'suetavpn';

const noop = () => {};

const stage: React.CSSProperties = {
  position: 'relative',
  height: 620,
};

const nav: React.CSSProperties = {
  display: 'grid',
  gap: 4,
};

const link: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 'var(--radius-control)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

/**
 * Выдвижное меню мобильного кабинета в открытом состоянии.
 *
 * Внутри — профиль, разделы и утилиты: ровно то, что собирает AppShell
 * на ширине меньше 1024 px.
 */
export const Open = () => {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div style={stage}>
      <Button ref={trigger} aria-label="Открыть меню" iconOnly variant="utility">
        <Icon name="menu" />
      </Button>
      <Drawer onClose={noop} open returnFocusRef={trigger}>
        <div style={{ display: 'grid', gap: 20 }}>
          <Brand compact />
          <nav aria-label="Разделы" style={nav}>
            <span style={link}><Icon name="dashboard" /> Главная</span>
            <span style={link}><Icon name="subscriptions" /> Подписки</span>
            <span style={link}><Icon name="balance" /> Баланс</span>
            <span style={link}><Icon name="referral" /> Рефералы</span>
            <span style={link}><Icon name="support" /> Поддержка</span>
            <span style={link}><Icon name="info" /> Информация</span>
          </nav>
          <div style={{ display: 'grid', gap: 8 }}>
            <Button variant="utility"><Icon name="bell" /><span>Уведомления</span></Button>
            <Button variant="utility"><Icon name="sun" /><span>Включить светлую тему</span></Button>
            <LanguageMenu drawer />
            <Button variant="danger"><Icon name="logout" /><span>Выйти</span></Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
