import { useRef } from 'react';
import { Button, Modal } from 'suetavpn';

const noop = () => {};

/**
 * Модальное окно в открытом состоянии.
 *
 * Компонент рендерится через портал в body, поэтому в карточке он занимает
 * весь кадр — так и задумано, окно перекрывает страницу целиком.
 */
export const Open = () => {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={trigger} variant="primary">Новое обращение</Button>
      <Modal onClose={noop} open returnFocusRef={trigger} title="Новое обращение">
        <div style={{ display: 'grid', gap: 12 }}>
          <label htmlFor="preview-subject">Тема обращения</label>
          <input
            id="preview-subject"
            defaultValue="Не подключается на телевизоре"
            readOnly
          />
          <label htmlFor="preview-message">Сообщение</label>
          <textarea
            id="preview-message"
            defaultValue="Подписка активна, на телефоне работает, а на Android TV пишет ошибку подключения."
            readOnly
            rows={4}
          />
          <Button variant="primary">Отправить</Button>
        </div>
      </Modal>
    </>
  );
};
