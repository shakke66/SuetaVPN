import type { Locale } from '../domain/types';

export const ru = {
  app: {
    name: 'SuetaVPN',
    welcome: 'Добро пожаловать, {name}!',
    loading: 'Загрузка приложения',
  },
  common: {
    actions: {
      save: 'Сохранить',
      cancel: 'Отмена',
      close: 'Закрыть',
      continue: 'Продолжить',
      back: 'Назад',
      open: 'Открыть',
      copy: 'Копировать',
      share: 'Поделиться',
      retry: 'Повторить',
      submit: 'Отправить',
    },
    status: {
      active: 'Активна',
      expired: 'Истекла',
      open: 'Открыто',
      answered: 'Есть ответ',
      completed: 'Выполнено',
      unread: 'Не прочитано',
    },
    loading: 'Загрузка',
    empty: 'Пока ничего нет',
    commandPending: 'Действие уже выполняется',
    rubles: '{amount} ₽',
    months: '{amount} мес.',
    days: '{amount} дн.',
  },
  accessibility: {
    skipToContent: 'Перейти к содержимому',
    closeDialog: 'Закрыть окно',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    loading: 'Идёт загрузка',
    currentPage: 'Текущая страница',
    externalLink: 'Откроется в новой вкладке',
  },
  auth: {
    title: 'Вход в SuetaVPN',
    subtitle: 'Выберите удобный способ',
    tabs: { login: 'Войти', register: 'Создать аккаунт' },
    telegram: {
      title: 'Через Telegram',
      continue: 'Продолжить с Telegram',
      pending: 'Открываем Telegram',
      miniApp: 'Вход через Telegram Mini App',
      success: 'Вход выполнен',
      backendValidation: 'Будущий backend должен проверить данные Telegram перед подтверждением личности.',
    },
    email: {
      label: 'Электронная почта',
      placeholder: 'name@example.com',
      continue: 'Получить код',
      codeLabel: 'Код подтверждения',
      codePlaceholder: 'Шесть цифр',
      verify: 'Подтвердить код',
      change: 'Изменить почту',
      success: 'Электронная почта подтверждена',
      localVerification: {
        title: 'Локальная проверка',
        description: 'Используйте этот код для входа в текущем браузере',
        code: 'Код: {amount}',
      },
    },
    validation: {
      emailRequired: 'Введите электронную почту',
      emailInvalid: 'Введите корректный адрес',
      codeRequired: 'Введите код',
      codeInvalid: 'Код должен содержать шесть цифр',
      codeWrong: 'Неверный код',
      codeExpired: 'Срок действия кода истёк',
    },
    actions: { logout: 'Выйти' },
    accessibility: {
      loginMethods: 'Способы входа',
      verificationCode: 'Локальный код подтверждения',
    },
  },
  navigation: {
    dashboard: 'Главная',
    subscriptions: 'Подписки',
    balance: 'Баланс',
    referrals: 'Рефералы',
    support: 'Поддержка',
    info: 'Информация',
    profile: 'Профиль',
    purchase: 'Оформление подписки',
  },
  shell: {
    theme: {
      switchToLight: 'Включить светлую тему',
      switchToDark: 'Включить тёмную тему',
    },
    language: { switchToRussian: 'Переключить на русский', switchToEnglish: 'Переключить на английский' },
    notifications: {
      title: 'Уведомления',
      open: 'Открыть уведомления',
      markAllRead: 'Прочитать все',
      empty: 'Нет уведомлений',
      unreadCount: 'Непрочитанных уведомлений: {amount}',
    },
    drawer: { title: 'Меню', open: 'Открыть меню', close: 'Закрыть меню' },
    bottomNav: { label: 'Основная навигация', more: 'Ещё' },
  },
  landing: {
    header: { navigation: 'Навигация', tariffs: 'Тарифы', faq: 'Вопросы', signIn: 'Войти', getStarted: 'Подключиться' },
    hero: {
      eyebrow: 'Приватный доступ без лишних сложностей',
      title: 'Интернет на вашей стороне',
      description: 'Быстрое подключение, понятные тарифы и поддержка в одном сервисе.',
      primaryAction: 'Выбрать тариф',
      secondaryAction: 'Как это работает',
    },
    trust: { title: 'Соединение, которому можно доверять', secure: 'Защищённый трафик', support: 'Поддержка рядом', devices: 'Для всех устройств' },
    features: { title: 'Всё необходимое', speed: 'Высокая скорость', locations: 'Надёжные локации', simplicity: 'Простое управление', traffic: 'Понятные лимиты' },
    tariffs: { title: 'Выберите свой тариф', subtitle: 'Два варианта без скрытых условий', select: 'Выбрать {name}' },
    steps: { title: 'Подключение за три шага', choose: 'Выберите тариф', signIn: 'Войдите удобным способом', connect: 'Подключите устройство' },
    value: { title: 'Помощь в нужный момент', description: 'Создайте обращение в личном кабинете и следите за ответом.', action: 'Перейти к поддержке' },
    reviews: { title: 'Нас выбирают за простоту', first: 'Подключение заняло несколько минут.', second: 'Удобно управлять подпиской с телефона.', third: 'Поддержка отвечает по делу.' },
    faq: { title: 'Частые вопросы', connectQuestion: 'Как подключить устройство?', connectAnswer: 'После оплаты откройте инструкции в личном кабинете.', paymentQuestion: 'Какие способы оплаты доступны?', paymentAnswer: 'Баланс можно пополнить через СБП или банковскую карту.' },
    footer: { description: 'SuetaVPN — удобное управление защищённым подключением.', agreement: 'Соглашение', privacy: 'Конфиденциальность', support: 'Поддержка', copyright: '© 2026 SuetaVPN' },
    accessibility: { heroArtwork: 'Защищённое соединение SuetaVPN', tariffList: 'Список тарифов', faqList: 'Частые вопросы' },
  },
  tariffs: {
    base: { name: 'БАЗА', description: 'Уверенный доступ на каждый день', traffic: 'Безлимитный трафик', devices: 'До {amount} устройств', locations: '{amount} локаций', speed: 'До {amount} Гбит/с', platforms: 'Android TV и Apple TV' },
    elite: { name: 'ЭЛИТА', description: 'Больше возможностей для сложных маршрутов', traffic: '{amount} ГБ обходного трафика', devices: 'До {amount} устройств', locations: '{amount} локаций', speed: 'До {amount} Гбит/с', platforms: 'Android TV и Apple TV', regularServers: 'Обычные серверы без ограничений' },
    period: { one: '1 месяц', three: '3 месяца', six: '6 месяцев', twelve: '12 месяцев' },
    perMonth: '{amount} в месяц',
  },
  dashboard: {
    title: 'Главная',
    greeting: 'Здравствуйте, {name}',
    balance: { title: 'Баланс', topUp: 'Пополнить баланс' },
    subscription: { title: 'Текущая подписка', none: 'Активной подписки нет', manage: 'Управлять подпиской', daysLeft: 'Осталось {amount} дн.' },
    referral: { title: 'Реферальная программа', earned: 'Заработано {amount}', open: 'Открыть рефералы' },
    connect: 'Подключить устройство',
  },
  subscriptions: {
    title: 'Подписки',
    current: 'Текущая подписка',
    empty: 'Подписка ещё не оформлена',
    choose: 'Выбрать подписку',
    renew: 'Продлить',
    changeTariff: 'Сменить тариф',
    expiresAt: 'Действует до {amount}',
    devices: 'Устройства: {amount}',
    traffic: 'Трафик: {amount}',
    purchase: {
      success: 'Подписка оформлена',
      tariffNotFound: 'Тариф не найден',
      periodNotSupported: 'Период не поддерживается',
      insufficientBalance: 'Недостаточно средств',
    },
  },
  connectDialog: {
    title: 'Подключить устройство',
    description: 'Выберите платформу и следуйте инструкции.',
    windows: 'Windows',
    macos: 'macOS',
    ios: 'iPhone и iPad',
    android: 'Android',
    router: 'Роутер',
    download: 'Скачать приложение',
    instruction: 'Открыть инструкцию',
    selected: 'Выбрана платформа: {platform}',
    accessibility: { platformList: 'Выбор платформы' },
  },
  purchase: {
    title: 'Оформление подписки',
    plan: { title: 'Выберите тариф', selected: 'Выбран тариф {name}' },
    period: { title: 'Выберите период' },
    summary: { title: 'Итого', tariff: 'Тариф', period: 'Период', total: 'К оплате', balance: 'Баланс после покупки', submit: 'Оформить подписку' },
    success: 'Подписка успешно оформлена',
    errors: { insufficientBalance: 'На балансе недостаточно средств', shortfall: 'Не хватает {amount}', topUp: 'Пополнить баланс', generic: 'Не удалось оформить подписку' },
    accessibility: { planGroup: 'Выбор тарифа', periodGroup: 'Выбор периода', error: 'Ошибка оформления подписки' },
  },
  balance: {
    title: 'Баланс',
    current: 'Текущий баланс',
    promo: { title: 'Промокод', label: 'Введите промокод', placeholder: 'Промокод', apply: 'Применить', success: 'Промокод применён: +{amount}', notFound: 'Промокод не найден', alreadyUsed: 'Промокод уже использован' },
    topUp: {
      title: 'Пополнить баланс',
      amountLabel: 'Сумма пополнения',
      methodLabel: 'Способ оплаты',
      sbp: 'СБП',
      card: 'Банковская карта',
      submit: 'Пополнить на {amount}',
      success: 'Баланс пополнен на {amount}',
      amountInvalid: 'Введите корректную сумму',
      amountTooLow: 'Минимальная сумма — 100 ₽',
      amountTooHigh: 'Максимальная сумма — 50 000 ₽',
      paymentMethodInvalid: 'Выберите способ оплаты',
    },
    history: { title: 'История операций', show: 'Показать историю', hide: 'Скрыть историю', empty: 'Операций пока нет', deposit: 'Пополнение', promo: 'Бонус', purchase: 'Покупка' },
    validation: { range: 'Введите сумму от 100 до 50 000 ₽' },
    accessibility: { amountRange: 'Выбрать сумму ползунком', historyToggle: 'Показать или скрыть историю операций' },
  },
  billing: {
    topUp: { success: 'Баланс пополнен на {amount}', amountInvalid: 'Некорректная сумма', amountTooLow: 'Минимальная сумма — 100 ₽', amountTooHigh: 'Максимальная сумма — 50 000 ₽', paymentMethodInvalid: 'Выберите способ оплаты' },
    promo: { success: 'Промокод применён', notFound: 'Промокод не найден', alreadyUsed: 'Промокод уже использован' },
  },
  referrals: {
    title: 'Реферальная программа',
    description: 'Приглашайте друзей через Telegram и получайте вознаграждение.',
    stats: { reward: 'Вознаграждение', invited: 'Приглашено', active: 'Активны', earned: 'Заработано' },
    telegram: { title: 'Ваша ссылка Telegram', copy: 'Копировать ссылку', share: 'Поделиться в Telegram' },
    toasts: { copied: 'Ссылка скопирована', copyFailed: 'Не удалось скопировать ссылку' },
  },
  support: {
    title: 'Поддержка',
    tickets: { title: 'Ваши обращения', empty: 'Обращений пока нет', open: 'Открыть обращение', createdAt: 'Создано {amount}', attachment: 'Вложение: {name}' },
    create: { title: 'Новое обращение', subjectLabel: 'Тема', subjectPlaceholder: 'Кратко опишите вопрос', messageLabel: 'Сообщение', messagePlaceholder: 'Расскажите подробнее', attachmentLabel: 'Прикрепить файл', submit: 'Создать обращение', success: 'Обращение создано', subjectRequired: 'Укажите тему', messageRequired: 'Введите сообщение' },
    reply: { messageLabel: 'Ответ', messagePlaceholder: 'Введите ответ', submit: 'Отправить ответ', success: 'Ответ отправлен', messageRequired: 'Введите сообщение', notFound: 'Обращение не найдено' },
    accessibility: { ticketList: 'Список обращений', conversation: 'Переписка по обращению' },
  },
  tickets: {
    create: { success: 'Обращение создано', subjectRequired: 'Укажите тему', messageRequired: 'Введите сообщение' },
    reply: { success: 'Ответ отправлен', messageRequired: 'Введите сообщение', notFound: 'Обращение не найдено' },
  },
  ticketNotifications: {
    title: 'Уведомления о тикетах',
    ticketCreated: 'Обращение «{name}» создано',
    ticketReplied: 'Получен ответ по обращению «{name}»',
    openTicket: 'Открыть обращение',
    markRead: 'Отметить прочитанным',
  },
  notifications: {
    markRead: { success: 'Уведомление прочитано', notFound: 'Уведомление не найдено' },
    markAllRead: { success: 'Все уведомления прочитаны' },
  },
  info: {
    title: 'Информация',
    tabs: { faq: 'Вопросы и ответы', agreement: 'Пользовательское соглашение', privacy: 'Политика конфиденциальности' },
    faq: { title: 'Вопросы и ответы', connection: 'Как подключиться?', connectionAnswer: 'Оформите подписку и выберите устройство.', renewal: 'Как продлить подписку?', renewalAnswer: 'Откройте раздел подписок и выберите период.' },
    agreement: { title: 'Пользовательское соглашение', placeholder: 'Текст соглашения будет опубликован здесь.' },
    privacy: { title: 'Политика конфиденциальности', placeholder: 'Текст политики будет опубликован здесь.' },
  },
  profile: {
    title: 'Профиль',
    name: 'Имя',
    username: 'Имя пользователя',
    role: 'Роль',
    email: 'Электронная почта',
    emailMissing: 'Не указана',
    emailVerified: 'Почта подтверждена',
    registeredAt: 'Дата регистрации',
    logout: 'Выйти',
  },
  onboarding: {
    title: 'Короткое знакомство',
    steps: { navigation: { title: 'Навигация', description: 'Здесь находятся основные разделы.' }, subscription: { title: 'Подписка', description: 'Следите за сроком и подключайте устройства.' }, notifications: { title: 'Уведомления', description: 'Ответы поддержки появятся здесь.' } },
    progress: 'Шаг {amount} из {name}',
    actions: { next: 'Далее', back: 'Назад', skip: 'Пропустить', finish: 'Начать работу' },
    accessibility: { spotlight: 'Подсвеченная область интерфейса' },
  },
  validation: { required: 'Заполните обязательное поле', invalidEmail: 'Введите корректную почту', minLength: 'Минимум {amount} символов', maxLength: 'Не более {amount} символов', generic: 'Проверьте введённые данные' },
  toast: { dismiss: 'Закрыть уведомление', success: 'Готово', error: 'Произошла ошибка', info: 'Информация' },
} as const;

type DeepStringShape<T> = { readonly [K in keyof T]: T[K] extends string ? string : DeepStringShape<T[K]> };

export const en = {
  app: { name: 'SuetaVPN', welcome: 'Welcome, {name}!', loading: 'Loading application' },
  common: {
    actions: { save: 'Save', cancel: 'Cancel', close: 'Close', continue: 'Continue', back: 'Back', open: 'Open', copy: 'Copy', share: 'Share', retry: 'Try again', submit: 'Submit' },
    status: { active: 'Active', expired: 'Expired', open: 'Open', answered: 'Answered', completed: 'Completed', unread: 'Unread' },
    loading: 'Loading', empty: 'Nothing here yet', commandPending: 'This action is already in progress', rubles: 'RUB {amount}', months: '{amount} mo.', days: '{amount} days',
  },
  accessibility: { skipToContent: 'Skip to content', closeDialog: 'Close dialog', openMenu: 'Open menu', closeMenu: 'Close menu', loading: 'Loading', currentPage: 'Current page', externalLink: 'Opens in a new tab' },
  auth: {
    title: 'Sign in to SuetaVPN', subtitle: 'Choose a convenient method', tabs: { login: 'Sign in', register: 'Create account' },
    telegram: { title: 'With Telegram', continue: 'Continue with Telegram', pending: 'Opening Telegram', miniApp: 'Sign in with Telegram Mini App', success: 'Signed in', backendValidation: 'A future backend must validate Telegram data before confirming identity.' },
    email: { label: 'Email', placeholder: 'name@example.com', continue: 'Get code', codeLabel: 'Verification code', codePlaceholder: 'Six digits', verify: 'Verify code', change: 'Change email', success: 'Email verified', localVerification: { title: 'Local verification', description: 'Use this code to sign in in this browser', code: 'Code: {amount}' } },
    validation: { emailRequired: 'Enter your email', emailInvalid: 'Enter a valid address', codeRequired: 'Enter the code', codeInvalid: 'The code must contain six digits', codeWrong: 'Incorrect code', codeExpired: 'The code has expired' },
    actions: { logout: 'Sign out' }, accessibility: { loginMethods: 'Sign-in methods', verificationCode: 'Local verification code' },
  },
  navigation: { dashboard: 'Dashboard', subscriptions: 'Subscriptions', balance: 'Balance', referrals: 'Referrals', support: 'Support', info: 'Information', profile: 'Profile', purchase: 'Purchase subscription' },
  shell: {
    theme: { switchToLight: 'Switch to light theme', switchToDark: 'Switch to dark theme' }, language: { switchToRussian: 'Switch to Russian', switchToEnglish: 'Switch to English' },
    notifications: { title: 'Notifications', open: 'Open notifications', markAllRead: 'Mark all as read', empty: 'No notifications', unreadCount: '{amount} unread notifications' },
    drawer: { title: 'Menu', open: 'Open menu', close: 'Close menu' }, bottomNav: { label: 'Primary navigation', more: 'More' },
  },
  landing: {
    header: { navigation: 'Navigation', tariffs: 'Plans', faq: 'FAQ', signIn: 'Sign in', getStarted: 'Get connected' },
    hero: { eyebrow: 'Private access without the hassle', title: 'The internet on your side', description: 'Fast setup, clear plans and support in one service.', primaryAction: 'Choose a plan', secondaryAction: 'How it works' },
    trust: { title: 'A connection you can trust', secure: 'Protected traffic', support: 'Support nearby', devices: 'For every device' },
    features: { title: 'Everything you need', speed: 'High speed', locations: 'Reliable locations', simplicity: 'Simple controls', traffic: 'Clear traffic limits' },
    tariffs: { title: 'Choose your plan', subtitle: 'Two options with no hidden terms', select: 'Choose {name}' },
    steps: { title: 'Connect in three steps', choose: 'Choose a plan', signIn: 'Sign in your preferred way', connect: 'Connect a device' },
    value: { title: 'Help when you need it', description: 'Create a ticket in your account and follow the reply.', action: 'Go to support' },
    reviews: { title: 'Chosen for simplicity', first: 'Setup took only a few minutes.', second: 'Managing a subscription from a phone is easy.', third: 'Support gives useful answers.' },
    faq: { title: 'Frequently asked questions', connectQuestion: 'How do I connect a device?', connectAnswer: 'After purchase, open the instructions in your account.', paymentQuestion: 'Which payment methods are available?', paymentAnswer: 'Top up your balance with SBP or a bank card.' },
    footer: { description: 'SuetaVPN makes protected connection management easy.', agreement: 'Agreement', privacy: 'Privacy', support: 'Support', copyright: '© 2026 SuetaVPN' },
    accessibility: { heroArtwork: 'Protected SuetaVPN connection', tariffList: 'Plan list', faqList: 'Frequently asked questions' },
  },
  tariffs: {
    base: { name: 'BASE', description: 'Reliable everyday access', traffic: 'Unlimited traffic', devices: 'Up to {amount} devices', locations: '{amount} locations', speed: 'Up to {amount} Gbps', platforms: 'Android TV and Apple TV' },
    elite: { name: 'ELITE', description: 'More options for complex routes', traffic: '{amount} GB bypass traffic', devices: 'Up to {amount} devices', locations: '{amount} locations', speed: 'Up to {amount} Gbps', platforms: 'Android TV and Apple TV', regularServers: 'Unlimited regular servers' },
    period: { one: '1 month', three: '3 months', six: '6 months', twelve: '12 months' }, perMonth: '{amount} per month',
  },
  dashboard: {
    title: 'Dashboard', greeting: 'Hello, {name}', balance: { title: 'Balance', topUp: 'Top up balance' },
    subscription: { title: 'Current subscription', none: 'No active subscription', manage: 'Manage subscription', daysLeft: '{amount} days left' },
    referral: { title: 'Referral program', earned: '{amount} earned', open: 'Open referrals' }, connect: 'Connect a device',
  },
  subscriptions: {
    title: 'Subscriptions', current: 'Current subscription', empty: 'No subscription yet', choose: 'Choose a subscription', renew: 'Renew', changeTariff: 'Change plan', expiresAt: 'Valid until {amount}', devices: 'Devices: {amount}', traffic: 'Traffic: {amount}',
    purchase: { success: 'Subscription purchased', tariffNotFound: 'Plan not found', periodNotSupported: 'Period is not supported', insufficientBalance: 'Insufficient balance' },
  },
  connectDialog: { title: 'Connect a device', description: 'Choose a platform and follow the instructions.', windows: 'Windows', macos: 'macOS', ios: 'iPhone and iPad', android: 'Android', router: 'Router', download: 'Download app', instruction: 'Open instructions', selected: 'Selected platform: {platform}', accessibility: { platformList: 'Platform selection' } },
  purchase: {
    title: 'Purchase subscription', plan: { title: 'Choose a plan', selected: '{name} selected' }, period: { title: 'Choose a period' },
    summary: { title: 'Summary', tariff: 'Plan', period: 'Period', total: 'Total', balance: 'Balance after purchase', submit: 'Purchase subscription' },
    success: 'Subscription purchased successfully', errors: { insufficientBalance: 'Insufficient balance', shortfall: 'Short by {amount}', topUp: 'Top up balance', generic: 'Could not purchase subscription' }, accessibility: { planGroup: 'Plan selection', periodGroup: 'Period selection', error: 'Subscription purchase error' },
  },
  balance: {
    title: 'Balance', current: 'Current balance',
    promo: { title: 'Promo code', label: 'Enter promo code', placeholder: 'Promo code', apply: 'Apply', success: 'Promo applied: +{amount}', notFound: 'Promo code not found', alreadyUsed: 'Promo code already used' },
    topUp: { title: 'Top up balance', amountLabel: 'Top-up amount', methodLabel: 'Payment method', sbp: 'SBP', card: 'Bank card', submit: 'Top up by {amount}', success: 'Balance topped up by {amount}', amountInvalid: 'Enter a valid amount', amountTooLow: 'Minimum amount is RUB 100', amountTooHigh: 'Maximum amount is RUB 50,000', paymentMethodInvalid: 'Choose a payment method' },
    history: { title: 'Transaction history', show: 'Show history', hide: 'Hide history', empty: 'No transactions yet', deposit: 'Top-up', promo: 'Bonus', purchase: 'Purchase' }, validation: { range: 'Enter an amount from RUB 100 to RUB 50,000' }, accessibility: { amountRange: 'Choose an amount with a slider', historyToggle: 'Show or hide transaction history' },
  },
  billing: {
    topUp: { success: 'Balance topped up by {amount}', amountInvalid: 'Invalid amount', amountTooLow: 'Minimum amount is RUB 100', amountTooHigh: 'Maximum amount is RUB 50,000', paymentMethodInvalid: 'Choose a payment method' },
    promo: { success: 'Promo code applied', notFound: 'Promo code not found', alreadyUsed: 'Promo code already used' },
  },
  referrals: { title: 'Referral program', description: 'Invite friends through Telegram and receive rewards.', stats: { reward: 'Reward', invited: 'Invited', active: 'Active', earned: 'Earned' }, telegram: { title: 'Your Telegram link', copy: 'Copy link', share: 'Share in Telegram' }, toasts: { copied: 'Link copied', copyFailed: 'Could not copy the link' } },
  support: {
    title: 'Support', tickets: { title: 'Your tickets', empty: 'No tickets yet', open: 'Open ticket', createdAt: 'Created {amount}', attachment: 'Attachment: {name}' },
    create: { title: 'New ticket', subjectLabel: 'Subject', subjectPlaceholder: 'Briefly describe your question', messageLabel: 'Message', messagePlaceholder: 'Tell us more', attachmentLabel: 'Attach file', submit: 'Create ticket', success: 'Ticket created', subjectRequired: 'Enter a subject', messageRequired: 'Enter a message' },
    reply: { messageLabel: 'Reply', messagePlaceholder: 'Enter your reply', submit: 'Send reply', success: 'Reply sent', messageRequired: 'Enter a message', notFound: 'Ticket not found' }, accessibility: { ticketList: 'Ticket list', conversation: 'Ticket conversation' },
  },
  tickets: { create: { success: 'Ticket created', subjectRequired: 'Enter a subject', messageRequired: 'Enter a message' }, reply: { success: 'Reply sent', messageRequired: 'Enter a message', notFound: 'Ticket not found' } },
  ticketNotifications: { title: 'Ticket notifications', ticketCreated: 'Ticket “{name}” created', ticketReplied: 'New reply in “{name}”', openTicket: 'Open ticket', markRead: 'Mark as read' },
  notifications: { markRead: { success: 'Notification marked as read', notFound: 'Notification not found' }, markAllRead: { success: 'All notifications marked as read' } },
  info: {
    title: 'Information', tabs: { faq: 'FAQ', agreement: 'User agreement', privacy: 'Privacy policy' },
    faq: { title: 'FAQ', connection: 'How do I connect?', connectionAnswer: 'Purchase a subscription and choose a device.', renewal: 'How do I renew?', renewalAnswer: 'Open subscriptions and choose a period.' },
    agreement: { title: 'User agreement', placeholder: 'The agreement text will be published here.' }, privacy: { title: 'Privacy policy', placeholder: 'The privacy policy will be published here.' },
  },
  profile: { title: 'Profile', name: 'Name', username: 'Username', role: 'Role', email: 'Email', emailMissing: 'Not provided', emailVerified: 'Email verified', registeredAt: 'Registration date', logout: 'Sign out' },
  onboarding: {
    title: 'A quick tour', steps: { navigation: { title: 'Navigation', description: 'Find the main sections here.' }, subscription: { title: 'Subscription', description: 'Track expiration and connect devices.' }, notifications: { title: 'Notifications', description: 'Support replies appear here.' } },
    progress: 'Step {amount} of {name}', actions: { next: 'Next', back: 'Back', skip: 'Skip', finish: 'Get started' }, accessibility: { spotlight: 'Highlighted interface area' },
  },
  validation: { required: 'Complete this required field', invalidEmail: 'Enter a valid email', minLength: 'At least {amount} characters', maxLength: 'No more than {amount} characters', generic: 'Check the entered values' },
  toast: { dismiss: 'Dismiss notification', success: 'Done', error: 'An error occurred', info: 'Information' },
} as const satisfies DeepStringShape<typeof ru>;

type DotPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPath<T[K]>}`
}[keyof T & string];

export type MessageKey = DotPath<typeof ru>;
export type MessageVariables = Readonly<Record<string, string | number>>;

export const messages: Readonly<Record<Locale, DeepStringShape<typeof ru>>> = { ru, en };

export function getMessage(
  locale: Locale,
  key: MessageKey,
  variables: MessageVariables = {},
): string {
  let value: unknown = messages[locale];
  for (const segment of key.split('.')) {
    value = typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)[segment]
      : undefined;
  }

  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (placeholder, name: string) => (
    Object.hasOwn(variables, name) ? String(variables[name]) : placeholder
  ));
}
