import { useRef } from 'react';
import { Button, ConnectDeviceDialog } from 'suetavpn';

const noop = () => {};

/** Диалог подключения устройства: выбор платформы из пяти вариантов. */
export const Open = () => {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={trigger} variant="primary">Подключить устройство</Button>
      <ConnectDeviceDialog onClose={noop} open returnFocusRef={trigger} />
    </>
  );
};
