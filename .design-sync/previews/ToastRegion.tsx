import { ToastRegion } from 'suetavpn';

const noop = () => {};

const surface: React.CSSProperties = {
  position: 'relative',
  minHeight: 180,
};

/** Успешное действие — подтверждение оплаты или отправки обращения. */
export const Success = () => (
  <div style={surface}>
    <ToastRegion
      messages={[{ id: 'topup', kind: 'success', text: 'Баланс пополнен на 2 000 ₽' }]}
      onDismiss={noop}
    />
  </div>
);

/** Ошибка — сообщение получает роль alert и читается скринридером сразу. */
export const Error = () => (
  <div style={surface}>
    <ToastRegion
      messages={[{ id: 'storage', kind: 'error', text: 'Не удалось сохранить данные в браузере. Изменения доступны до закрытия страницы.' }]}
      onDismiss={noop}
    />
  </div>
);

/** Несколько сообщений подряд складываются стопкой. */
export const Stacked = () => (
  <div style={surface}>
    <ToastRegion
      messages={[
        { id: 'ticket', kind: 'success', text: 'Обращение создано' },
        { id: 'copy', kind: 'info', text: 'Ссылка скопирована' },
        { id: 'promo', kind: 'error', text: 'Промокод не найден' },
      ]}
      onDismiss={noop}
    />
  </div>
);
