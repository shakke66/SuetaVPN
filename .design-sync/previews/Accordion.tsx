import { Accordion } from 'suetavpn';

const FAQ = [
  {
    id: 'service',
    title: 'Что такое SuetaVPN и зачем он нужен?',
    content: (
      <p>
        Сервис шифрует интернет-трафик и направляет его через защищённый сервер. Это помогает
        безопасно пользоваться интернетом и защищать данные в публичных сетях Wi-Fi.
      </p>
    ),
  },
  {
    id: 'devices',
    title: 'На каких устройствах работает?',
    content: (
      <p>
        Windows, macOS, Android, iOS и Linux. Одну подписку можно использовать на нескольких
        устройствах одновременно, в пределах лимита тарифа.
      </p>
    ),
  },
  {
    id: 'protocol',
    title: 'Какой протокол используется?',
    content: (
      <p>
        Современный протокол VLESS. Он работает быстрее классических решений, а обнаружить
        и заблокировать его сложнее.
      </p>
    ),
  },
];

/** Все ответы закрыты — состояние по умолчанию в кабинете. */
export const Closed = () => (
  <Accordion ariaLabel="Частые вопросы" items={FAQ} />
);

/** Первый ответ раскрыт — так аккордеон показывается на лендинге. */
export const FirstOpen = () => (
  <Accordion ariaLabel="Частые вопросы" defaultOpenIds={['service']} items={FAQ} />
);

/** Раскрыть можно несколько ответов одновременно. */
export const MultipleOpen = () => (
  <Accordion ariaLabel="Частые вопросы" defaultOpenIds={['service', 'protocol']} items={FAQ} />
);
