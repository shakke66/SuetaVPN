(function bootstrapSuetaMvp() {
  'use strict';

  const core = window.SuetaCore;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const liveRegion = document.getElementById('app-live-region');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  if (!core || !app || !modalRoot || !toastRoot) {
    if (app) {
      app.textContent = 'Не удалось запустить демонстрацию. Обновите страницу.';
    }
    return;
  }

  const CABINET_ROUTES = new Set([
    'dashboard',
    'subscriptions',
    'purchase',
    'balance',
    'referral',
    'support',
    'info',
    'profile',
  ]);

  const ROUTE_TITLES = {
    welcome: 'SuetaVPN — интернет без лишних границ',
    dashboard: 'Главная — SuetaVPN',
    subscriptions: 'Подписки — SuetaVPN',
    purchase: 'Выбор тарифа — SuetaVPN',
    balance: 'Баланс — SuetaVPN',
    referral: 'Рефералы — SuetaVPN',
    support: 'Поддержка — SuetaVPN',
    info: 'Информация — SuetaVPN',
    profile: 'Профиль — SuetaVPN',
  };

  const INFO_TABS = {
    faq: 'FAQ',
    rules: 'Правила',
    privacy: 'Конфиденциальность',
    offer: 'Оферта',
    statuses: 'Статусы',
  };

  const NOTIFICATION_COPY = {
    subscription: ['Окончание подписки', 'Напомним заранее о продлении'],
    traffic: ['Порог трафика', 'Сообщим при использовании 80% лимита'],
    balance: ['Низкий баланс', 'Предупредим, если средств мало'],
    news: ['Новости сервиса', 'Новые приложения и локации'],
    promo: ['Акции и промокоды', 'Редкие предложения без спама'],
  };

  const ONBOARDING_STEPS = [
    {
      target: 'welcome',
      title: 'Добро пожаловать!',
      description: 'Это главная страница демо-кабинета. Здесь собрана самая важная информация.',
    },
    {
      target: 'subscription',
      title: 'Статус подписки',
      description: 'Следите за тарифом, сроком, трафиком и подключёнными устройствами.',
    },
    {
      target: 'connect-devices',
      title: 'Подключите устройство',
      description: 'Откройте инструкции для телефона, компьютера или телевизора.',
    },
    {
      target: 'balance',
      title: 'Ваш баланс',
      description: 'Пополняйте демо-баланс и проверяйте историю локальных операций.',
    },
    {
      target: 'quick-actions',
      title: 'Быстрые действия',
      description: 'Основные разделы всегда доступны в один клик.',
    },
  ];

  const ui = {
    drawerOpen: false,
    drawerReturnFocus: null,
    selectedTicketId: null,
    infoTab: 'faq',
    historyExpanded: true,
    connectionPlatform: 'ios',
    modalReturnFocus: null,
    onboardingIndex: -1,
    onboardingTimer: null,
    onboardingResizeHandler: null,
    onboardingReturnFocus: null,
    topUpAmount: 500,
  };

  let state = loadState();

  function loadState() {
    try {
      return core.hydrateState(localStorage.getItem(core.STORAGE_KEY));
    } catch (_error) {
      return core.createInitialState();
    }
  }

  function persist(nextState) {
    state = nextState;
    try {
      localStorage.setItem(core.STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      showToast('Изменение применено, но браузер запретил сохранение.', 'warning');
    }
    applyTheme();
  }

  function applyResult(result, options) {
    const settings = { renderAfter: true, toast: true, ...(options || {}) };
    if (result.ok) {
      persist(result.state);
      if (settings.toast) showToast(result.message, 'success');
      haptic('success');
      if (settings.renderAfter) render();
      return true;
    }

    if (settings.toast) showToast(result.message, 'error');
    haptic('error');
    return false;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    if (themeMeta) themeMeta.setAttribute('content', state.theme === 'light' ? '#F5F6F8' : '#121212');
  }

  function haptic(type) {
    try {
      const feedback = window.Telegram?.WebApp?.HapticFeedback;
      if (!feedback) return;
      if (type === 'success' || type === 'error' || type === 'warning') {
        feedback.notificationOccurred(type);
      } else {
        feedback.impactOccurred('light');
      }
    } catch (_error) {
      // Telegram enhancement is optional in the static MVP.
    }
  }

  function icon(name, className) {
    return `<svg class="icon ${className || ''}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function preferredScrollBehavior() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function getTariff(id) {
    return state.tariffs.find((tariff) => tariff.id === id) || state.tariffs[0];
  }

  function getRoute() {
    const value = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return value || 'welcome';
  }

  function navigate(route) {
    closeDrawer(false);
    closeModal();
    stopOnboarding(false);
    const normalized = route === 'home' ? 'dashboard' : route;
    if (getRoute() === normalized) {
      render();
      window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
      return;
    }
    window.location.hash = `#/${normalized}`;
  }

  function ensureRoute(route) {
    if (route === 'welcome') return route;
    if (!CABINET_ROUTES.has(route)) return state.sessionActive ? 'dashboard' : 'welcome';
    if (!state.sessionActive) return 'welcome';
    return route;
  }

  function render() {
    clearTimeout(ui.onboardingTimer);
    ui.onboardingTimer = null;
    applyTheme();

    const requested = getRoute();
    const route = ensureRoute(requested);
    if (route !== requested) {
      window.location.hash = `#/${route}`;
      return;
    }

    document.title = ROUTE_TITLES[route] || ROUTE_TITLES.welcome;
    app.innerHTML = route === 'welcome'
      ? renderLanding()
      : renderCabinet(route);

    document.body.classList.toggle('is-drawer-open', ui.drawerOpen);
    if (ui.drawerOpen) ui.drawerReturnFocus = app.querySelector('[data-drawer-trigger]');
    if (modalRoot.firstElementChild && ui.modalReturnFocus && !ui.modalReturnFocus.isConnected) {
      const returnAction = ui.modalReturnFocus.dataset.action;
      const returnRoute = ui.modalReturnFocus.dataset.route;
      ui.modalReturnFocus = Array.from(app.querySelectorAll('[data-action], [data-route]')).find((element) => (
        (returnAction && element.dataset.action === returnAction)
        || (returnRoute && element.dataset.route === returnRoute)
      )) || null;
    }

    if (route === 'dashboard' && !state.onboardingCompleted) {
      ui.onboardingTimer = window.setTimeout(() => startOnboarding(), 550);
    }

    if (route !== 'welcome') {
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    }
  }

  function renderBrand() {
    return `
      <span class="brand-mark" aria-hidden="true">S</span>
      <span class="brand-name">SuetaVPN</span>
    `;
  }

  function renderThemeButton(extraClass) {
    const isDark = state.theme === 'dark';
    return `
      <button class="icon-button theme-toggle ${extraClass || ''}" type="button" data-action="toggle-theme" aria-label="${isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}">
        ${icon(isDark ? 'sun' : 'moon')}
      </button>
    `;
  }

  function renderLanding() {
    const tariffCards = state.tariffs.map((tariff) => renderLandingTariff(tariff)).join('');
    return `
      <div class="landing-page">
        <header class="landing-header" data-landing-header>
          <div class="container landing-header__inner">
            <a class="brand" href="#/welcome" aria-label="SuetaVPN — на главную">
              ${renderBrand()}
            </a>
            <nav class="landing-nav" aria-label="Навигация по странице">
              <a href="#tariffs" data-action="scroll-section" data-target="tariffs">Тарифы</a>
              <a href="#benefits" data-action="scroll-section" data-target="benefits">Преимущества</a>
              <a href="#how-it-works" data-action="scroll-section" data-target="how-it-works">Подключение</a>
              <a href="#faq" data-action="scroll-section" data-target="faq">FAQ</a>
            </nav>
            <div class="landing-header__actions">
              ${renderThemeButton()}
              <button class="btn btn--secondary" type="button" data-action="enter-demo">Личный кабинет</button>
              <button class="btn btn--primary" type="button" data-action="start-purchase" data-tariff="base">Подключиться</button>
              <button class="icon-button mobile-menu-toggle" type="button" data-action="open-landing-menu" aria-label="Открыть меню">
                ${icon('menu')}
              </button>
            </div>
          </div>
        </header>

        <main id="main-content">
          <section class="hero">
            <div class="container hero__grid">
              <div class="hero__content">
                <span class="eyebrow">${icon('shield', 'icon--sm')} Интернет под вашим контролем</span>
                <h1>Быстрый VPN. <span>Без лишней суеты.</span></h1>
                <p class="hero__lead">Стабильный доступ к привычным сервисам на всех устройствах. Простое подключение, понятный кабинет и поддержка, которая отвечает.</p>
                <div class="hero__actions">
                  <button class="btn btn--primary" type="button" data-action="start-purchase" data-tariff="base">
                    Попробовать демо ${icon('arrow-right', 'icon--sm')}
                  </button>
                  <button class="btn btn--secondary" type="button" data-action="scroll-section" data-target="how-it-works">
                    Как это работает
                  </button>
                </div>
                <div class="hero__meta" aria-label="Ключевые условия">
                  <span>${icon('check', 'icon--sm')} Настройка за 2 минуты</span>
                  <span>${icon('check', 'icon--sm')} До 20 устройств</span>
                  <span>${icon('check', 'icon--sm')} От 149 ₽ в месяц</span>
                </div>
              </div>

              ${renderHeroPreview()}
            </div>
          </section>

          <section class="trust-strip" aria-label="Показатели сервиса">
            <div class="container trust-strip__inner">
              <div class="trust-stat"><strong>99,9%</strong><span>доступность сети</span></div>
              <div class="trust-stat"><strong>7</strong><span>быстрых локаций</span></div>
              <div class="trust-stat"><strong>&lt; 2 мин</strong><span>на подключение</span></div>
              <div class="trust-stat"><strong>24/7</strong><span>доступ к кабинету</span></div>
            </div>
          </section>

          <section class="landing-section" id="tariffs">
            <div class="container">
              <div class="section-heading section-heading--center">
                <span class="eyebrow">Тарифы</span>
                <h2>Выберите свой уровень свободы</h2>
                <p>Все тарифы включают понятное управление, безопасное подключение и возможность сменить план позже.</p>
              </div>
              <div class="pricing-grid">${tariffCards}</div>
            </div>
          </section>

          <section class="landing-section landing-section--soft" id="benefits">
            <div class="container">
              <div class="section-heading">
                <span class="eyebrow">Почему SuetaVPN</span>
                <h2>Спокойный интернет каждый день</h2>
                <p>Мы убрали сложные настройки из основного сценария и оставили пользователю только нужные действия.</p>
              </div>
              <div class="feature-grid">
                ${renderFeature('lightning', 'Быстрое подключение', 'Выберите платформу, следуйте короткой инструкции и подключайтесь без ручного редактирования конфигов.')}
                ${renderFeature('globe', 'Нужные локации', 'Оптимальные маршруты для видео, общения, работы и обычного веб-сёрфинга.')}
                ${renderFeature('lock', 'Приватность по умолчанию', 'Минимум данных в интерфейсе, безопасные протоколы и прозрачное управление аккаунтом.')}
                ${renderFeature('devices', 'Все ваши устройства', 'Телефон, компьютер, планшет и телевизор управляются из одного личного кабинета.')}
                ${renderFeature('support', 'Поддержка внутри кабинета', 'Создавайте обращения, прикладывайте снимки и продолжайте диалог в одном месте.')}
                ${renderFeature('wallet', 'Понятные платежи', 'Баланс, промокоды и история операций отображаются без скрытых пунктов и мелкого шрифта.')}
              </div>
            </div>
          </section>

          <section class="landing-section" id="how-it-works">
            <div class="container">
              <div class="section-heading section-heading--center">
                <span class="eyebrow">Три шага</span>
                <h2>От тарифа до подключения</h2>
                <p>MVP показывает полный пользовательский путь без реального списания и выдачи VPN-ключа.</p>
              </div>
              <div class="steps-grid">
                ${renderStep('01', 'Выберите тариф', 'Сравните устройства, трафик и стоимость. Итог сразу виден в кабинете.')}
                ${renderStep('02', 'Пополните демо-баланс', 'Проверьте сценарий оплаты без банковской карты и внешнего платёжного окна.')}
                ${renderStep('03', 'Откройте подключение', 'Получите инструкцию для своей платформы и скачайте безопасный demo-config.')}
              </div>
            </div>
          </section>

          <section class="landing-section landing-section--soft" id="reviews">
            <div class="container">
              <div class="section-heading section-heading--center">
                <span class="eyebrow">Отзывы</span>
                <h2>Сервис, который не мешает</h2>
                <p>Демонстрационные отзывы показывают структуру будущего лендинга и не являются реальными пользовательскими заявлениями.</p>
              </div>
              <div class="reviews-grid">
                ${renderReview('А', 'Анна', 'iOS · демо-отзыв', 'Подключение понятное: открыла инструкцию, выбрала телефон и сразу увидела, что делать дальше.')}
                ${renderReview('М', 'Максим', 'Windows · демо-отзыв', 'Нравится, что баланс, срок и устройства собраны на одном экране без перегруженных таблиц.')}
                ${renderReview('И', 'Илья', 'Android TV · демо-отзыв', 'Если что-то непонятно, тикет создаётся прямо в кабинете. Не нужно искать отдельную форму.')}
              </div>
            </div>
          </section>

          <section class="landing-section" id="faq">
            <div class="container">
              <div class="section-heading section-heading--center">
                <span class="eyebrow">FAQ</span>
                <h2>Коротко о главном</h2>
              </div>
              <div class="faq-list">
                ${renderFaq('landing-faq-1', 'Это уже настоящий VPN?', 'Нет. Сейчас перед вами frontend MVP: интерфейс и действия работают локально, но реальные аккаунты, платежи и VPN-ключи появятся после подключения backend.')}
                ${renderFaq('landing-faq-2', 'Можно ли проверить весь кабинет?', 'Да. Нажмите «Попробовать демо» и пройдите покупку, пополнение, промокод, рефералы, поддержку и настройки профиля.')}
                ${renderFaq('landing-faq-3', 'Сохраняются ли мои действия?', 'Демо-состояние хранится только в localStorage этого браузера. В профиле его можно полностью сбросить.')}
                ${renderFaq('landing-faq-4', 'Почему фон не двигается?', 'Статичный фон выбран сознательно: он лучше читается, экономит батарею телефона и не отвлекает от интерфейса.')}
                ${renderFaq('landing-faq-5', 'Будет ли светлая тема?', 'Да. В MVP уже есть новая нейтральная бело-серая тема без бежевого оттенка.')}
              </div>
            </div>
          </section>

          <section class="landing-cta">
            <div class="container landing-cta__card">
              <div>
                <h2>Посмотрите кабинет изнутри</h2>
                <p>Без регистрации, платежей и внешних переходов. Все изменения останутся только на вашем устройстве.</p>
              </div>
              <button class="btn btn--primary" type="button" data-action="enter-demo">
                Открыть демо ${icon('arrow-right', 'icon--sm')}
              </button>
            </div>
          </section>
        </main>

        <footer class="landing-footer">
          <div class="container landing-footer__grid">
            <div>
              <a class="brand" href="#/welcome">${renderBrand()}</a>
              <p>Демонстрационный MVP сайта и личного кабинета. Не выполняет реальные платежи и VPN-подключения.</p>
              <span>© 2026 SuetaVPN</span>
            </div>
            <div class="footer-links">
              <strong>Продукт</strong>
              <a href="#tariffs" data-action="scroll-section" data-target="tariffs">Тарифы</a>
              <a href="#benefits" data-action="scroll-section" data-target="benefits">Преимущества</a>
              <button class="footer-button" type="button" data-action="enter-demo">Демо-кабинет</button>
            </div>
            <div class="footer-links">
              <strong>Документы</strong>
              <button class="footer-button" type="button" data-action="open-info-tab" data-tab="rules">Правила</button>
              <button class="footer-button" type="button" data-action="open-info-tab" data-tab="privacy">Конфиденциальность</button>
              <button class="footer-button" type="button" data-action="open-info-tab" data-tab="offer">Оферта</button>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  function renderHeroPreview() {
    const tariff = getTariff(state.subscription.tariffId);
    const trafficPercent = Math.min(100, Math.round((state.subscription.trafficUsed / state.subscription.trafficLimit) * 100));
    return `
      <div class="hero-preview" aria-label="Предварительный вид личного кабинета">
        <div class="preview-window">
          <div class="preview-window__bar">
            <div class="preview-window__dots"><i></i><i></i><i></i></div>
            <span>cabinet.suetavpn.demo</span>
            <span class="demo-badge">DEMO</span>
          </div>
          <div class="preview-window__body">
            <div class="preview-welcome">
              <div><strong>Добрый день, ${escapeHtml(state.profile.name)}!</strong><span>Ваш личный кабинет</span></div>
              <span class="profile-avatar">${escapeHtml(state.profile.name.slice(0, 1))}</span>
            </div>
            <div class="preview-subscription">
              <div class="preview-subscription__top">
                <span class="status-badge status-badge--success">Активна</span>
                <span>${state.subscription.daysLeft} дней</span>
              </div>
              <h3>${escapeHtml(tariff.name)}</h3>
              <p>до ${escapeHtml(state.subscription.expiresAt)}</p>
              <div class="preview-progress">
                <div class="preview-progress__labels"><span>Трафик</span><span>${state.subscription.trafficUsed} / ${state.subscription.trafficLimit} ГБ</span></div>
                <div class="progress"><div class="progress__bar" style="width:${trafficPercent}%"></div></div>
              </div>
            </div>
            <div class="preview-stats">
              <div class="preview-stat"><span>Баланс</span><strong>${formatMoney(state.balance)}</strong></div>
              <div class="preview-stat"><span>Устройства</span><strong>${state.subscription.devicesUsed} / ${state.subscription.devicesLimit}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLandingTariff(tariff) {
    return `
      <article class="pricing-card ${tariff.popular ? 'pricing-card--popular' : ''}">
        <div class="pricing-card__top">
          <span class="pricing-card__name">${escapeHtml(tariff.name)}</span>
          ${tariff.popular ? '<span class="status-badge">Популярный</span>' : ''}
        </div>
        <div class="pricing-card__price">${formatMoney(tariff.priceMonthly)} <small>/ месяц</small></div>
        <p class="pricing-card__tagline">${escapeHtml(tariff.tagline)}</p>
        <ul class="check-list">
          <li>${icon('check', 'icon--sm')} ${tariff.devices} ${plural(tariff.devices, 'устройство', 'устройства', 'устройств')}</li>
          <li>${icon('check', 'icon--sm')} ${tariff.traffic} ГБ трафика</li>
          <li>${icon('check', 'icon--sm')} Все базовые локации</li>
          <li>${icon('check', 'icon--sm')} Поддержка в кабинете</li>
        </ul>
        <button class="btn ${tariff.popular ? 'btn--primary' : 'btn--secondary'} btn--wide" type="button" data-action="start-purchase" data-tariff="${tariff.id}">
          Выбрать ${escapeHtml(tariff.name)}
        </button>
      </article>
    `;
  }

  function renderFeature(iconName, title, copy) {
    return `
      <article class="feature-card">
        <span class="feature-card__icon">${icon(iconName, 'icon--lg')}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
      </article>
    `;
  }

  function renderStep(number, title, copy) {
    return `
      <article class="step-card">
        <span class="step-card__number">${number}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(copy)}</p>
      </article>
    `;
  }

  function renderReview(letter, name, meta, copy) {
    return `
      <article class="review-card">
        <div class="review-stars" aria-label="5 из 5">${Array.from({ length: 5 }, () => icon('star', 'icon--sm')).join('')}</div>
        <blockquote>«${escapeHtml(copy)}»</blockquote>
        <div class="review-author">
          <span class="review-avatar">${escapeHtml(letter)}</span>
          <div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(meta)}</span></div>
        </div>
      </article>
    `;
  }

  function renderFaq(id, question, answer) {
    return `
      <article class="faq-item">
        <h3>
          <button class="faq-item__button" type="button" data-action="toggle-faq" aria-expanded="false" aria-controls="${id}">
            <span>${escapeHtml(question)}</span>${icon('chevron-down')}
          </button>
        </h3>
        <div class="faq-item__panel" id="${id}" hidden>${escapeHtml(answer)}</div>
      </article>
    `;
  }

  function plural(value, one, few, many) {
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function renderCabinet(route) {
    return `
      <div class="cabinet-layout">
        ${renderDesktopHeader(route)}
        ${renderMobileHeader()}
        <main class="cabinet-main" id="main-content">${renderCabinetPage(route)}</main>
        ${renderBottomNav(route)}
        ${renderDrawer(route)}
        <button class="drawer-backdrop ${ui.drawerOpen ? 'is-open' : ''}" type="button" data-action="close-drawer" aria-label="Закрыть меню" ${ui.drawerOpen ? '' : 'hidden'}></button>
      </div>
    `;
  }

  function navItems() {
    return [
      ['dashboard', 'home', 'Главная'],
      ['subscriptions', 'shield', 'Подписки'],
      ['balance', 'wallet', 'Баланс'],
      ['referral', 'users', 'Рефералы'],
      ['support', 'support', 'Поддержка'],
      ['info', 'info', 'Информация'],
      ['profile', 'profile', 'Профиль'],
    ];
  }

  function renderDesktopHeader(route) {
    return `
      <header class="cabinet-header">
        <div class="container cabinet-header__inner">
          <button class="brand brand-button" type="button" data-route="dashboard" aria-label="На главную кабинета">${renderBrand()}<span class="demo-badge">DEMO</span></button>
          <nav class="cabinet-nav" aria-label="Разделы кабинета">
            ${navItems().map(([itemRoute, iconName, label]) => `
              <button class="cabinet-nav__item ${route === itemRoute ? 'is-active' : ''}" type="button" data-route="${itemRoute}" aria-label="${escapeHtml(label)}" ${route === itemRoute ? 'aria-current="page"' : ''}>
                ${icon(iconName, 'icon--sm')}<span>${label}</span>
              </button>
            `).join('')}
          </nav>
          <div class="cabinet-header__actions">
            ${renderThemeButton()}
            <button class="icon-button" type="button" data-route="profile" aria-label="Открыть профиль">
              <span class="profile-avatar profile-avatar--compact">${escapeHtml(state.profile.name.slice(0, 1))}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  function renderMobileHeader() {
    return `
      <header class="mobile-cabinet-bar">
        <button class="brand brand-button" type="button" data-route="dashboard">${renderBrand()}<span class="demo-badge">DEMO</span></button>
        <button class="icon-button" type="button" data-action="open-drawer" data-drawer-trigger aria-label="Открыть меню" aria-expanded="${ui.drawerOpen}">
          ${icon('menu')}
        </button>
      </header>
    `;
  }

  function renderBottomNav(route) {
    const items = navItems().slice(0, 5);
    return `
      <nav class="bottom-nav" aria-label="Основная мобильная навигация">
        ${items.map(([itemRoute, iconName, label]) => `
          <button class="bottom-nav__item ${route === itemRoute ? 'is-active' : ''}" type="button" data-route="${itemRoute}" aria-label="${escapeHtml(label)}" ${route === itemRoute ? 'aria-current="page"' : ''}>
            ${icon(iconName)}<span>${label}</span>
          </button>
        `).join('')}
      </nav>
    `;
  }

  function renderDrawer(route) {
    return `
      <aside class="mobile-drawer ${ui.drawerOpen ? 'is-open' : ''}" role="dialog" aria-modal="true" aria-label="Меню кабинета" aria-hidden="${!ui.drawerOpen}" ${ui.drawerOpen ? '' : 'hidden inert'}>
        <div class="drawer-header">
          <span class="brand">${renderBrand()}</span>
          <button class="icon-button" type="button" data-action="close-drawer" aria-label="Закрыть меню">${icon('close')}</button>
        </div>
        <nav class="drawer-nav">
          ${navItems().map(([itemRoute, iconName, label]) => `
            <button class="${route === itemRoute ? 'is-active' : ''}" type="button" data-route="${itemRoute}" aria-label="${escapeHtml(label)}">
              ${icon(iconName)}<span>${label}</span>
            </button>
          `).join('')}
        </nav>
        <div class="drawer-footer">
          <button class="btn btn--secondary btn--wide" type="button" data-action="toggle-theme">
            ${icon(state.theme === 'dark' ? 'sun' : 'moon', 'icon--sm')} ${state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button class="btn btn--ghost btn--wide" type="button" data-action="logout">${icon('logout', 'icon--sm')} Выйти из демо</button>
        </div>
      </aside>
    `;
  }

  function renderCabinetPage(route) {
    switch (route) {
      case 'dashboard': return renderDashboard();
      case 'subscriptions': return renderSubscriptions();
      case 'purchase': return renderPurchase();
      case 'balance': return renderBalance();
      case 'referral': return renderReferral();
      case 'support': return renderSupport();
      case 'info': return renderInfo();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  }

  function renderPageHeading(title, subtitle, actions) {
    return `
      <div class="page-heading">
        <div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>
        ${actions || ''}
      </div>
    `;
  }

  function renderDashboard() {
    const subscription = state.subscription;
    const tariff = getTariff(subscription.tariffId);
    const trafficPercent = Math.min(100, Math.round((subscription.trafficUsed / subscription.trafficLimit) * 100));
    const devicePercent = Math.min(100, Math.round((subscription.devicesUsed / subscription.devicesLimit) * 100));
    return `
      <section class="cabinet-page">
        <div class="welcome-row" data-onboarding="welcome">
          <div>
            <span class="pill">${icon('star', 'icon--sm')} ${escapeHtml(state.profile.role)}</span>
            <h1>Добрый день, ${escapeHtml(state.profile.name)}!</h1>
            <p>Управляйте подпиской и устройствами без лишней суеты.</p>
          </div>
        </div>

        <div class="content-grid content-grid--dashboard">
          <article class="subscription-hero content-card" data-onboarding="subscription">
            <div class="subscription-hero__header">
              <div>
                <span class="status-badge status-badge--success">Активна</span>
                <h2>${escapeHtml(tariff.name)}</h2>
                <p class="card-subtitle">Действует до ${escapeHtml(subscription.expiresAt)} · осталось ${subscription.daysLeft} дней</p>
              </div>
              <button class="btn btn--secondary btn--small" type="button" data-route="subscriptions">Управление ${icon('arrow-right', 'icon--sm')}</button>
            </div>
            <div class="subscription-hero__meta">
              <span>${icon('globe', 'icon--sm')} ${tariff.traffic} ГБ</span>
              <span>${icon('devices', 'icon--sm')} до ${tariff.devices} устройств</span>
              <span>${icon('shield', 'icon--sm')} все базовые локации</span>
            </div>
            <div class="usage-row">
              <div class="usage-row__labels"><span>Трафик</span><strong>${subscription.trafficUsed} / ${subscription.trafficLimit} ГБ</strong></div>
              <div class="progress"><div class="progress__bar" style="width:${trafficPercent}%"></div></div>
            </div>
            <div class="usage-row">
              <div class="usage-row__labels"><span>Устройства</span><strong>${subscription.devicesUsed} / ${subscription.devicesLimit}</strong></div>
              <div class="progress"><div class="progress__bar" style="width:${devicePercent}%"></div></div>
            </div>
            <button class="btn btn--primary btn--wide dashboard-connect" type="button" data-action="open-connection" data-onboarding="connect-devices">
              ${icon('devices', 'icon--sm')} Подключить устройство
            </button>
          </article>

          <div class="stats-grid">
            <button class="stat-card interactive-card" type="button" data-route="balance" data-onboarding="balance">
              <span class="stat-card__top"><span class="stat-card__label">Баланс</span><span class="stat-icon">${icon('wallet', 'icon--sm')}</span></span>
              <strong class="stat-card__value">${formatMoney(state.balance)}</strong>
              <span class="stat-card__hint">Нажмите, чтобы пополнить</span>
            </button>
            <button class="stat-card interactive-card" type="button" data-route="referral">
              <span class="stat-card__top"><span class="stat-card__label">Рефералы</span><span class="stat-icon">${icon('users', 'icon--sm')}</span></span>
              <strong class="stat-card__value">${state.referral.active}</strong>
              <span class="stat-card__hint">+${formatMoney(state.referral.earned)} заработано</span>
            </button>
          </div>
        </div>

        <div class="section-block" data-onboarding="quick-actions">
          <div class="section-block__heading"><h2>Быстрые действия</h2><span>Основные сценарии MVP</span></div>
          <div class="quick-actions">
            <button class="quick-action" type="button" data-route="balance"><span class="quick-action__icon">${icon('plus', 'icon--sm')}</span><strong>Пополнить баланс</strong></button>
            <button class="quick-action" type="button" data-route="purchase"><span class="quick-action__icon">${icon('shield', 'icon--sm')}</span><strong>Продлить подписку</strong></button>
            <button class="quick-action" type="button" data-route="referral"><span class="quick-action__icon">${icon('users', 'icon--sm')}</span><strong>Пригласить друзей</strong></button>
          </div>
        </div>

        <aside class="demo-notice">${icon('info', 'icon--sm')} Все данные и операции на этой странице демонстрационные и хранятся только в вашем браузере.</aside>
      </section>
    `;
  }

  function renderSubscriptions() {
    const subscription = state.subscription;
    const tariff = getTariff(subscription.tariffId);
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Подписки', 'Текущий тариф и доступные варианты', `<button class="btn btn--primary" type="button" data-route="purchase">${icon('plus', 'icon--sm')} Купить подписку</button>`)}
        <article class="subscription-hero content-card">
          <div class="subscription-hero__header">
            <div>
              <span class="status-badge status-badge--success">Активная подписка</span>
              <h2>${escapeHtml(tariff.name)}</h2>
              <p class="card-subtitle">До ${escapeHtml(subscription.expiresAt)} · ${subscription.daysLeft} дней</p>
            </div>
            <button class="btn btn--secondary" type="button" data-route="purchase">Продлить</button>
          </div>
          <div class="subscription-details-grid">
            ${renderMetric('Трафик', `${subscription.trafficUsed} / ${subscription.trafficLimit} ГБ`, 'globe')}
            ${renderMetric('Устройства', `${subscription.devicesUsed} / ${subscription.devicesLimit}`, 'devices')}
            ${renderMetric('Сброс трафика', 'Каждые 30 дней', 'history')}
            ${renderMetric('Автопродление', 'Не подключено', 'wallet')}
          </div>
          <div class="inline-actions">
            <button class="btn btn--primary" type="button" data-action="open-connection">${icon('devices', 'icon--sm')} Подключить устройство</button>
            <button class="btn btn--secondary" type="button" data-route="purchase">Сменить тариф</button>
          </div>
        </article>
        <div class="section-block">
          <div class="section-block__heading"><h2>Доступные тарифы</h2><span>Цена за один месяц</span></div>
          <div class="plans-grid">${state.tariffs.map((item) => renderPlanCard(item, item.id === tariff.id)).join('')}</div>
        </div>
      </section>
    `;
  }

  function renderMetric(label, value, iconName) {
    return `<div class="metric"><span class="metric__icon">${icon(iconName, 'icon--sm')}</span><span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span></div>`;
  }

  function renderPlanCard(tariff, isCurrent) {
    return `
      <button class="plan-card ${state.selectedTariffId === tariff.id ? 'is-selected' : ''}" type="button" data-action="select-tariff" data-tariff="${tariff.id}" aria-pressed="${state.selectedTariffId === tariff.id}">
        <span class="card-row"><span class="status-badge">${tariff.popular ? 'Популярный' : `${tariff.devices} устр.`}</span>${isCurrent ? '<span class="status-badge status-badge--success">Текущий</span>' : ''}</span>
        <h3>${escapeHtml(tariff.name)}</h3>
        <p class="card-subtitle">${escapeHtml(tariff.tagline)}</p>
        <div class="plan-card__price">${formatMoney(tariff.priceMonthly)} <small>/ мес.</small></div>
        <div class="plan-card__meta"><span>${tariff.traffic} ГБ трафика</span><span>До ${tariff.devices} устройств</span></div>
      </button>
    `;
  }

  function renderPurchase() {
    const quote = core.calculatePrice(state, state.selectedTariffId, state.selectedMonths);
    const selected = quote.ok ? quote.tariff : state.tariffs[0];
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Выберите тариф', 'Покупка работает на локальном демо-балансе', `<button class="btn btn--secondary" type="button" data-route="subscriptions">${icon('arrow-left', 'icon--sm')} Назад</button>`)}
        <div class="purchase-layout">
          <div class="content-grid">
            <article class="content-card">
              <div class="section-block__heading"><h2>1. Тариф</h2><span>Выберите подходящий набор</span></div>
              <div class="plans-grid">${state.tariffs.map((tariff) => renderPlanCard(tariff, false)).join('')}</div>
            </article>
            <article class="content-card">
              <div class="section-block__heading"><h2>2. Период</h2><span>Чем дольше, тем выгоднее</span></div>
              <div class="period-selector">
                ${core.SUPPORTED_PERIODS.map((months) => {
                  const discounts = { 1: 0, 3: 5, 6: 10, 12: 20 };
                  return `<button class="period-option ${state.selectedMonths === months ? 'is-selected' : ''}" type="button" data-action="select-period" data-months="${months}" aria-pressed="${state.selectedMonths === months}"><strong>${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}</strong><span>${discounts[months] ? `−${discounts[months]}%` : 'без скидки'}</span></button>`;
                }).join('')}
              </div>
            </article>
          </div>
          <aside class="content-card purchase-summary">
            <span class="demo-badge">Демо-покупка</span>
            <h2 class="purchase-summary__title">${escapeHtml(selected.name)}</h2>
            <p class="card-subtitle">${escapeHtml(selected.tagline)}</p>
            <div class="summary-list">
              <div class="summary-row"><span>Период</span><strong>${quote.months} мес.</strong></div>
              <div class="summary-row"><span>Устройства</span><strong>${selected.devices}</strong></div>
              <div class="summary-row"><span>Трафик</span><strong>${selected.traffic} ГБ</strong></div>
              <div class="summary-row"><span>Скидка</span><strong>${quote.discountPercent}%</strong></div>
              <div class="summary-row summary-row--total"><span>Итого</span><strong>${formatMoney(quote.total)}</strong></div>
            </div>
            <div class="balance-inline"><span>Демо-баланс</span><strong>${formatMoney(state.balance)}</strong></div>
            <button class="btn btn--primary btn--wide" type="button" data-action="purchase">Активировать за ${formatMoney(quote.total)}</button>
            <p class="field-hint centered">Реального списания и VPN-ключа не будет.</p>
          </aside>
        </div>
      </section>
    `;
  }

  function renderBalance() {
    const transactions = ui.historyExpanded ? state.transactions : state.transactions.slice(0, 3);
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Баланс', 'Демо-пополнение и локальная история операций', `<span class="demo-badge">Без реальной оплаты</span>`)}
        <div class="balance-overview">
          <article class="content-card balance-total"><span>Текущий баланс</span><strong>${formatMoney(state.balance)}</strong><small>Доступно для демо-покупок</small></article>
          <article class="content-card">
            <div class="card-row"><div><h2 class="card-title">Промокод</h2><p class="card-subtitle">Попробуйте SUETA10</p></div>${icon('ticket', 'icon--lg')}</div>
            <form class="input-row balance-form" data-form="promo" novalidate>
              <label class="sr-only" for="promo-code">Промокод</label>
              <input class="input" id="promo-code" name="code" autocomplete="off" placeholder="SUETA10" required>
              <button class="btn btn--secondary" type="submit">Применить</button>
            </form>
          </article>
        </div>

        <div class="content-grid content-grid--two balance-columns">
          <article class="content-card">
            <div class="section-block__heading"><h2>Пополнить баланс</h2><span>От 100 до 50 000 ₽</span></div>
            <form class="form-grid" data-form="topup" novalidate>
              <div class="field">
                <label for="topup-amount">Сумма пополнения</label>
                <input class="input" id="topup-amount" name="amount" type="number" min="100" max="50000" step="100" value="${ui.topUpAmount}" data-topup-input required>
                <input class="range" aria-label="Сумма пополнения ползунком" type="range" min="100" max="50000" step="100" value="${ui.topUpAmount}" data-topup-range>
              </div>
              <fieldset class="field fieldset-reset">
                <legend class="field-label">Способ оплаты</legend>
                <div class="payment-methods">
                  <label class="payment-option"><input type="radio" name="method" value="СБП" checked><span><strong>СБП</strong><span>Демо-зачисление</span></span></label>
                  <label class="payment-option"><input type="radio" name="method" value="Карта"><span><strong>Банковская карта</strong><span>Без ввода реквизитов</span></span></label>
                </div>
              </fieldset>
              <button class="btn btn--primary btn--wide" type="submit">Зачислить ${formatMoney(ui.topUpAmount)} в демо</button>
              <p class="field-hint centered">Платёжная страница не открывается, банковские данные не запрашиваются.</p>
            </form>
          </article>

          <article class="content-card">
            <div class="section-block__heading"><h2>История операций</h2><button class="btn btn--ghost btn--small" type="button" data-action="toggle-history">${ui.historyExpanded ? 'Свернуть' : 'Показать всё'}</button></div>
            <div class="transactions">
              ${transactions.map(renderTransaction).join('')}
            </div>
          </article>
        </div>
      </section>
    `;
  }

  function renderTransaction(transaction) {
    const positive = transaction.amount > 0;
    const icons = { deposit: 'plus', promo: 'star', purchase: 'shield' };
    return `
      <div class="transaction">
        <span class="transaction__icon">${icon(icons[transaction.type] || 'history', 'icon--sm')}</span>
        <span class="transaction__info"><strong>${escapeHtml(transaction.description)}</strong><span>${formatDate(transaction.date)} · выполнено</span></span>
        <strong class="transaction__amount ${positive ? 'transaction__amount--positive' : 'transaction__amount--negative'}">${positive ? '+' : '−'}${formatMoney(Math.abs(transaction.amount))}</strong>
      </div>
    `;
  }

  function renderReferral() {
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Рефералы', 'Приглашайте друзей и проверяйте механику программы', `<button class="btn btn--primary" type="button" data-action="share-referral" data-value="${escapeHtml(state.referral.cabinetLink)}">${icon('share', 'icon--sm')} Поделиться</button>`)}
        <div class="referral-stats">
          ${renderReferralStat('Приглашено', state.referral.invited, 'users')}
          ${renderReferralStat('Активных', state.referral.active, 'shield')}
          ${renderReferralStat('Комиссия', `${state.referral.rewardPercent}%`, 'star')}
          ${renderReferralStat('Заработано', formatMoney(state.referral.earned), 'wallet')}
        </div>
        <div class="content-grid content-grid--two">
          <article class="content-card">
            <div class="section-block__heading"><h2>Ваши ссылки</h2><span>Демонстрационные адреса</span></div>
            <div class="form-grid">
              ${renderReferralLink('Ссылка на бота', state.referral.botLink)}
              ${renderReferralLink('Ссылка на кабинет', state.referral.cabinetLink)}
            </div>
          </article>
          <article class="content-card">
            <div class="section-block__heading"><h2>Как это работает</h2><span>${state.referral.rewardPercent}% с платежей</span></div>
            <ol class="numbered-list">
              <li><span>1</span><p><strong>Отправьте ссылку</strong> другу удобным способом.</p></li>
              <li><span>2</span><p><strong>Друг открывает кабинет</strong> и выбирает тариф.</p></li>
              <li><span>3</span><p><strong>После реальной интеграции</strong> вознаграждение будет начисляться на баланс.</p></li>
            </ol>
          </article>
        </div>
        <article class="content-card section-block">
          <div class="section-block__heading"><h2>Последние приглашения</h2><span>Демо-список</span></div>
          <div class="referral-table">
            ${renderReferralUser('Кирилл', 'Активен', 'Сегодня', true)}
            ${renderReferralUser('Мария', 'Активна', 'Вчера', true)}
            ${renderReferralUser('Анонимный пользователь', 'Без покупки', '3 дня назад', false)}
          </div>
        </article>
      </section>
    `;
  }

  function renderReferralStat(label, value, iconName) {
    return `<article class="stat-card"><span class="stat-card__top"><span class="stat-card__label">${escapeHtml(label)}</span><span class="stat-icon">${icon(iconName, 'icon--sm')}</span></span><strong class="stat-card__value">${escapeHtml(value)}</strong><span class="stat-card__hint">Демо-статистика</span></article>`;
  }

  function renderReferralLink(label, value) {
    return `
      <div class="field">
        <span class="field-label">${escapeHtml(label)}</span>
        <div class="referral-link">
          <span class="referral-link__value">${escapeHtml(value)}</span>
          <span class="inline-actions">
            <button class="icon-button" type="button" data-action="copy" data-value="${escapeHtml(value)}" aria-label="Копировать ${escapeHtml(label)}">${icon('copy', 'icon--sm')}</button>
            <button class="icon-button" type="button" data-action="share-referral" data-value="${escapeHtml(value)}" aria-label="Поделиться ${escapeHtml(label)}">${icon('share', 'icon--sm')}</button>
          </span>
        </div>
      </div>
    `;
  }

  function renderReferralUser(name, status, date, active) {
    return `<div class="referral-user"><span class="review-avatar">${escapeHtml(name.slice(0, 1))}</span><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(date)}</small></span><span class="status-badge ${active ? 'status-badge--success' : ''}">${escapeHtml(status)}</span></div>`;
  }

  function renderSupport() {
    if (!ui.selectedTicketId && state.tickets.length) ui.selectedTicketId = state.tickets[0].id;
    const selected = state.tickets.find((ticket) => ticket.id === ui.selectedTicketId) || state.tickets[0];
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Поддержка', 'Создавайте и продолжайте локальные демо-обращения', `<button class="btn btn--primary" type="button" data-action="open-ticket-modal">${icon('plus', 'icon--sm')} Новый тикет</button>`)}
        <div class="content-grid content-grid--support">
          <aside class="content-card">
            <div class="section-block__heading"><h2>Ваши тикеты</h2><span>${state.tickets.length}</span></div>
            <div class="tickets-list">
              ${state.tickets.map((ticket) => `<button class="ticket-item ${selected?.id === ticket.id ? 'is-active' : ''}" type="button" data-action="select-ticket" data-ticket="${escapeHtml(ticket.id)}"><strong>${escapeHtml(ticket.subject)}</strong><span>${formatDate(ticket.createdAt)} · ${ticket.status === 'answered' ? 'есть ответ' : 'открыт'}</span></button>`).join('')}
            </div>
          </aside>
          <article class="content-card ticket-thread">
            ${selected ? renderTicketThread(selected) : '<div class="empty-state"><span class="empty-state__icon">' + icon('support') + '</span><h3>Выберите тикет</h3><p>Или создайте новое обращение.</p></div>'}
          </article>
        </div>
      </section>
    `;
  }

  function renderTicketThread(ticket) {
    return `
      <div class="card-row ticket-thread__header"><div><h2 class="card-title">${escapeHtml(ticket.subject)}</h2><p class="card-subtitle">${ticket.status === 'answered' ? 'Ответ поддержки получен' : 'Открыт'}${ticket.attachmentName ? ` · ${escapeHtml(ticket.attachmentName)}` : ''}</p></div><span class="status-badge ${ticket.status === 'answered' ? 'status-badge--success' : 'status-badge--warning'}">${ticket.status === 'answered' ? 'Отвечен' : 'Открыт'}</span></div>
      <div class="ticket-messages">
        ${ticket.messages.map((message) => `<div class="ticket-message ${message.author === 'user' ? 'ticket-message--user' : ''}"><p>${escapeHtml(message.text)}</p><span>${message.author === 'user' ? 'Вы' : 'Поддержка'} · ${formatDate(message.date)}</span></div>`).join('')}
      </div>
      <form class="input-row" data-form="ticket-reply" data-ticket="${escapeHtml(ticket.id)}" novalidate>
        <label class="sr-only" for="ticket-reply">Ответ в тикете</label>
        <input class="input" id="ticket-reply" name="message" placeholder="Напишите ответ…" autocomplete="off" required>
        <button class="btn btn--primary" type="submit">Отправить</button>
      </form>
    `;
  }

  function renderInfo() {
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Информация', 'Ответы и демонстрационные юридические разделы')}
        <article class="content-card">
          <div class="tabs" role="tablist" aria-label="Разделы информации">
            ${Object.entries(INFO_TABS).map(([key, label]) => `<button class="tab ${ui.infoTab === key ? 'is-active' : ''}" id="info-tab-${key}" type="button" role="tab" aria-selected="${ui.infoTab === key}" aria-controls="info-panel" tabindex="${ui.infoTab === key ? '0' : '-1'}" data-action="info-tab" data-tab="${key}">${label}</button>`).join('')}
          </div>
          <div class="tab-panel" id="info-panel" role="tabpanel" aria-labelledby="info-tab-${ui.infoTab}">${renderInfoPanel(ui.infoTab)}</div>
        </article>
      </section>
    `;
  }

  function renderInfoPanel(tab) {
    if (tab === 'faq') {
      return `<div class="faq-list faq-list--wide">${renderFaq('cabinet-faq-1', 'Где взять конфигурацию?', 'На Главной или в разделе Подписки нажмите «Подключить устройство». MVP скачивает только безопасный демонстрационный файл.')}${renderFaq('cabinet-faq-2', 'Как продлить подписку?', 'Перейдите в Подписки или Покупку, выберите тариф и период. Стоимость спишется только с локального демо-баланса.')}${renderFaq('cabinet-faq-3', 'Как вернуть исходные данные?', 'В Профиле есть кнопка «Сбросить демо-данные». Она очистит только локальное состояние этого MVP.')}${renderFaq('cabinet-faq-4', 'Работает ли поддержка?', 'Тикеты и ответы сохраняются локально. После backend-интеграции форма будет отправлять их на сервер.') }</div>`;
    }

    if (tab === 'statuses') {
      return `<div class="loyalty-grid">${renderStatusLevel('НОВИЧОК', '0 ₽', 'Базовые условия', true)}${renderStatusLevel('ПОСТОЯННЫЙ', '5 000 ₽', 'Скидка до 5%', false)}${renderStatusLevel('СВОЙ', '15 000 ₽', 'Скидка до 10%', false)}</div>`;
    }

    const copy = {
      rules: ['Правила использования', 'Используйте сервис законно и не передавайте доступ третьим лицам за пределами лимита тарифа. Данные этого MVP демонстрационные и не создают реальных обязательств.'],
      privacy: ['Политика конфиденциальности', 'MVP хранит изменения только в localStorage текущего браузера и не отправляет их на сервер. Не вводите реальные платёжные данные или секреты.'],
      offer: ['Публичная оферта', 'Этот экран показывает будущую структуру документа. До подключения backend и платёжной системы кнопки не заключают договор и не проводят оплату.'],
    };
    const [title, description] = copy[tab] || copy.rules;
    return `<div class="legal-copy"><span class="demo-badge">Демо-документ</span><h2>${title}</h2><p>${description}</p><h3>1. Общие положения</h3><p>Полный юридический текст будет подключён после согласования с владельцем сервиса и не должен формироваться из демонстрационных данных.</p><h3>2. Обратная связь</h3><p>После интеграции актуальные контакты и дата обновления будут приходить с backend.</p></div>`;
  }

  function renderStatusLevel(name, threshold, benefit, current) {
    return `<article class="content-card loyalty-card ${current ? 'loyalty-card--current' : ''}"><span class="status-badge ${current ? 'status-badge--success' : ''}">${current ? 'Текущий' : 'Недоступен'}</span><h3>${name}</h3><p>Порог: ${threshold}</p><strong>${benefit}</strong></article>`;
  }

  function renderProfile() {
    return `
      <section class="cabinet-page">
        ${renderPageHeading('Профиль', 'Демо-аккаунт и локальные настройки')}
        <div class="content-grid content-grid--two profile-grid">
          <article class="content-card">
            <div class="profile-head"><span class="profile-avatar profile-avatar--large">${escapeHtml(state.profile.name.slice(0, 1))}</span><div><h2>${escapeHtml(state.profile.name)}</h2><p>${escapeHtml(state.profile.username)} · ${escapeHtml(state.profile.role)}</p></div></div>
            <div class="profile-meta"><span><small>Регистрация</small><strong>${escapeHtml(state.profile.registeredAt)}</strong></span><span><small>Режим</small><strong>Frontend MVP</strong></span></div>
          </article>
          <article class="content-card">
            <div class="section-block__heading"><h2>Email для входа</h2><span>${state.profile.email ? 'Сохранён локально' : 'Не привязан'}</span></div>
            <form class="form-grid" data-form="email" novalidate>
              <div class="field"><label for="profile-email">Email</label><input class="input" id="profile-email" name="email" type="email" autocomplete="email" value="${escapeHtml(state.profile.email)}" placeholder="you@example.com" required><p class="field-hint">Письмо не отправляется в MVP.</p></div>
              <button class="btn btn--secondary" type="submit">${state.profile.email ? 'Изменить email' : 'Привязать email'}</button>
            </form>
          </article>
        </div>

        <article class="content-card section-block">
          <div class="section-block__heading"><h2>Уведомления</h2><span>Настройки сохраняются локально</span></div>
          <div class="settings-list">
            ${Object.entries(NOTIFICATION_COPY).map(([key, [title, description]]) => `<div class="setting-row"><span><strong>${title}</strong><span>${description}</span></span><label class="switch"><span class="sr-only">${title}</span><input type="checkbox" data-notification="${key}" ${state.notifications[key] ? 'checked' : ''}><span class="switch__track"></span></label></div>`).join('')}
          </div>
        </article>

        <div class="content-grid content-grid--two section-block">
          <article class="content-card">
            <div class="section-block__heading"><h2>Оформление</h2><span>Текущая: ${state.theme === 'dark' ? 'тёмная' : 'светлая'}</span></div>
            <div class="theme-options">
              <button class="theme-card ${state.theme === 'dark' ? 'is-selected' : ''}" type="button" data-action="set-theme" data-theme="dark"><span class="theme-swatch theme-swatch--dark"></span><strong>Тёмная</strong><small>#121212</small></button>
              <button class="theme-card ${state.theme === 'light' ? 'is-selected' : ''}" type="button" data-action="set-theme" data-theme="light"><span class="theme-swatch theme-swatch--light"></span><strong>Светлая</strong><small>#F5F6F8</small></button>
            </div>
          </article>
          <article class="content-card">
            <div class="section-block__heading"><h2>Демо-управление</h2><span>Без влияния на реальный аккаунт</span></div>
            <div class="form-grid">
              <button class="btn btn--secondary btn--wide" type="button" data-action="replay-onboarding">${icon('info', 'icon--sm')} Показать обучение снова</button>
              <button class="btn btn--danger btn--wide" type="button" data-action="confirm-reset">Сбросить демо-данные</button>
              <button class="btn btn--ghost btn--wide" type="button" data-action="logout">${icon('logout', 'icon--sm')} Выйти на лендинг</button>
            </div>
          </article>
        </div>
      </section>
    `;
  }

  function openLandingMenu(preserveReturnFocus) {
    openModal({
      title: 'Меню',
      body: `<div class="form-grid"><button class="btn btn--secondary btn--wide" type="button" data-action="modal-scroll" data-target="tariffs">Тарифы</button><button class="btn btn--secondary btn--wide" type="button" data-action="modal-scroll" data-target="benefits">Преимущества</button><button class="btn btn--secondary btn--wide" type="button" data-action="modal-scroll" data-target="how-it-works">Подключение</button><button class="btn btn--secondary btn--wide" type="button" data-action="modal-scroll" data-target="faq">FAQ</button><button class="btn btn--ghost btn--wide" type="button" data-action="toggle-theme">${state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</button></div>`,
      footer: `<button class="btn btn--primary btn--wide" type="button" data-action="enter-demo">Открыть демо-кабинет</button>`,
      initialFocus: preserveReturnFocus ? '[data-action="toggle-theme"]' : undefined,
      preserveReturnFocus: Boolean(preserveReturnFocus),
    });
  }

  function openConnectionModal(focusActiveTab) {
    const platformCopy = {
      ios: ['iPhone и iPad', 'Установите совместимое приложение, затем импортируйте демонстрационную ссылку.'],
      android: ['Android', 'Откройте приложение-клиент и добавьте профиль из буфера обмена.'],
      windows: ['Windows', 'Скачайте клиент, импортируйте профиль и включите соединение.'],
      macos: ['macOS', 'Добавьте профиль в приложение и разрешите создание VPN-конфигурации.'],
      tv: ['TV', 'Откройте приложение на телевизоре и используйте код подключения из реального кабинета.'],
    };
    const [title, copy] = platformCopy[ui.connectionPlatform];
    openModal({
      title: 'Подключить устройство',
      wide: true,
      body: `
        <aside class="demo-notice">${icon('info', 'icon--sm')} Это демонстрационная инструкция. Она не создаёт рабочее VPN-подключение.</aside>
        <div class="tabs connection-tabs" role="tablist">
          ${Object.entries(platformCopy).map(([key, [label]]) => `<button class="tab ${ui.connectionPlatform === key ? 'is-active' : ''}" id="connection-tab-${key}" type="button" data-action="connection-platform" data-platform="${key}" role="tab" aria-selected="${ui.connectionPlatform === key}" aria-controls="connection-panel" tabindex="${ui.connectionPlatform === key ? '0' : '-1'}">${label}</button>`).join('')}
        </div>
        <div id="connection-panel" role="tabpanel" aria-labelledby="connection-tab-${ui.connectionPlatform}">
          <div class="connection-guide">
            <div class="fake-qr" aria-label="Демонстрационный QR-код"><span>DEMO</span></div>
            <div><span class="eyebrow">${escapeHtml(title)}</span><h3>Подключение за несколько шагов</h3><p>${escapeHtml(copy)}</p><ol><li>Установите подходящий VPN-клиент.</li><li>Скопируйте demo-ссылку или скачайте текстовый файл.</li><li>После backend-интеграции здесь появится персональный ключ.</li></ol></div>
          </div>
          <div class="referral-link"><span class="referral-link__value">suetavpn://demo/not-a-real-key</span><button class="icon-button" type="button" data-action="copy" data-value="suetavpn://demo/not-a-real-key" aria-label="Копировать demo-ссылку">${icon('copy', 'icon--sm')}</button></div>
        </div>
      `,
      footer: `<button class="btn btn--secondary" type="button" data-action="close-modal">Закрыть</button><button class="btn btn--primary" type="button" data-action="download-demo-config">${icon('download', 'icon--sm')} Скачать demo-config</button>`,
      initialFocus: focusActiveTab ? `#connection-tab-${ui.connectionPlatform}` : undefined,
      preserveReturnFocus: Boolean(focusActiveTab),
    });
  }

  function openTicketModal() {
    openModal({
      title: 'Новый тикет',
      body: `
        <form class="form-grid" id="create-ticket-form" data-form="create-ticket" novalidate>
          <div class="field"><label for="ticket-subject">Тема</label><input class="input" id="ticket-subject" name="subject" maxlength="120" placeholder="Кратко опишите вопрос" autofocus required></div>
          <div class="field"><label for="ticket-message">Сообщение</label><textarea class="textarea" id="ticket-message" name="message" maxlength="2000" placeholder="Что произошло и на каком устройстве?" required></textarea></div>
          <div class="field"><label for="ticket-attachment">Изображение, необязательно</label><input class="input file-input" id="ticket-attachment" name="attachment" type="file" accept="image/png,image/jpeg,image/webp"><p class="field-hint">Файл не загружается и сохраняется только его название.</p></div>
        </form>
      `,
      footer: `<button class="btn btn--secondary" type="button" data-action="close-modal">Отмена</button><button class="btn btn--primary" type="submit" form="create-ticket-form">Создать демо-тикет</button>`,
    });
  }

  function openResetModal() {
    openModal({
      title: 'Сбросить демо-данные?',
      body: '<p class="modal-copy">Баланс, операции, тикеты, email, настройки и прогресс обучения вернутся в исходное состояние. Реальные данные не затрагиваются.</p>',
      footer: '<button class="btn btn--secondary" type="button" data-action="close-modal">Отмена</button><button class="btn btn--danger" type="button" data-action="reset-demo">Сбросить</button>',
    });
  }

  function openInsufficientModal(result) {
    openModal({
      title: 'Недостаточно демо-средств',
      body: `<div class="insufficient"><span class="empty-state__icon">${icon('wallet')}</span><p>Для выбранного тарифа нужно <strong>${formatMoney(result.required)}</strong>. Не хватает <strong>${formatMoney(result.missing)}</strong>.</p></div>`,
      footer: '<button class="btn btn--secondary" type="button" data-action="close-modal">Изменить тариф</button><button class="btn btn--primary" type="button" data-route="balance">Пополнить баланс</button>',
    });
  }

  function openModal(options) {
    if (!options.preserveReturnFocus) {
      ui.modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop-close">
        <section class="modal ${options.wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-panel>
          <header class="modal__header"><h2 id="modal-title">${escapeHtml(options.title)}</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="Закрыть">${icon('close')}</button></header>
          <div class="modal__body">${options.body || ''}</div>
          ${options.footer ? `<footer class="modal__footer">${options.footer}</footer>` : ''}
        </section>
      </div>
    `;
    document.body.classList.add('is-modal-open');
    window.requestAnimationFrame(() => {
      const focusTarget = options.initialFocus
        ? modalRoot.querySelector(options.initialFocus)
        : modalRoot.querySelector('[autofocus], input, textarea, select, button, [href]');
      focusTarget?.focus();
    });
  }

  function closeModal() {
    if (!modalRoot.firstElementChild) return;
    modalRoot.innerHTML = '';
    document.body.classList.remove('is-modal-open');
    const target = ui.modalReturnFocus;
    ui.modalReturnFocus = null;
    target?.focus?.();
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    const kind = type || 'info';
    toast.className = `toast toast--${kind}`;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<span class="toast__icon">${icon(kind === 'success' ? 'check' : kind === 'error' ? 'close' : 'info', 'icon--sm')}</span><p></p><button type="button" aria-label="Закрыть уведомление">${icon('close', 'icon--sm')}</button>`;
    toast.querySelector('p').textContent = message;
    toast.querySelector('button').addEventListener('click', () => toast.remove(), { once: true });
    toastRoot.append(toast);
    window.setTimeout(() => toast.remove(), 4400);
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.append(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        if (!copied) throw new Error('copy failed');
      }
      showToast('Скопировано в буфер обмена.', 'success');
      haptic('success');
      return true;
    } catch (_error) {
      showToast('Не удалось скопировать. Выделите текст вручную.', 'error');
      return false;
    }
  }

  async function shareReferral(value) {
    const data = { title: 'SuetaVPN', text: 'Посмотрите демонстрацию SuetaVPN:', url: value };
    try {
      if (navigator.share) {
        await navigator.share(data);
        showToast('Меню отправки открыто.', 'success');
      } else {
        await copyText(`${data.text} ${data.url}`);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') await copyText(`${data.text} ${data.url}`);
    }
  }

  function downloadDemoConfig() {
    const content = [
      'SUETAVPN DEMO CONFIG — NOT A REAL VPN CONFIGURATION',
      'Этот файл создан только для проверки интерфейса MVP.',
      `Платформа: ${ui.connectionPlatform}`,
      'Настоящий персональный ключ появится после подключения backend.',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'suetavpn-demo-config.txt';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Безопасный demo-config скачан.', 'success');
  }

  function enterDemo(targetRoute) {
    const result = core.setSession(state, true);
    persist(result.state);
    navigate(targetRoute || 'dashboard');
  }

  function setTheme(theme) {
    const result = core.setTheme(state, theme);
    if (applyResult(result, { toast: false, renderAfter: false })) {
      const landingMenuOpen = modalRoot.querySelector('#modal-title')?.textContent === 'Меню';
      render();
      if (landingMenuOpen) openLandingMenu(true);
      showToast(theme === 'dark' ? 'Включена тёмная тема.' : 'Включена светлая тема.', 'success');
    }
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function openDrawer() {
    ui.drawerReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : app.querySelector('[data-drawer-trigger]');
    ui.drawerOpen = true;
    document.body.classList.add('is-drawer-open');
    const drawer = app.querySelector('.mobile-drawer');
    const backdrop = app.querySelector('.drawer-backdrop');
    const trigger = app.querySelector('[data-drawer-trigger]');
    if (drawer) {
      drawer.hidden = false;
      drawer.inert = false;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.add('is-open');
    }
    trigger?.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => drawer?.querySelector('button')?.focus());
  }

  function closeDrawer(restoreFocus) {
    if (!ui.drawerOpen) return;
    ui.drawerOpen = false;
    document.body.classList.remove('is-drawer-open');
    const drawer = app.querySelector('.mobile-drawer');
    const backdrop = app.querySelector('.drawer-backdrop');
    const trigger = app.querySelector('[data-drawer-trigger]');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      drawer.hidden = true;
    }
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.hidden = true;
    }
    trigger?.setAttribute('aria-expanded', 'false');
    const returnFocus = ui.drawerReturnFocus;
    ui.drawerReturnFocus = null;
    if (restoreFocus !== false) {
      (returnFocus?.isConnected ? returnFocus : trigger)?.focus?.();
    }
  }

  function scrollToSection(target, closeFirst) {
    if (closeFirst) closeModal();
    const element = document.getElementById(target);
    if (!element) return;
    element.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
  }

  function startOnboarding(force) {
    if (getRoute() !== 'dashboard') return;
    if (state.onboardingCompleted && !force) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stopOnboarding(false, false);
    ui.onboardingReturnFocus = returnFocus;
    ui.onboardingIndex = 0;
    app.inert = true;
    renderOnboardingStep();
    ui.onboardingResizeHandler = () => positionOnboarding();
    window.addEventListener('resize', ui.onboardingResizeHandler);
    window.addEventListener('scroll', ui.onboardingResizeHandler, true);
  }

  function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[ui.onboardingIndex];
    if (!step) {
      stopOnboarding(true);
      return;
    }
    const target = document.querySelector(`[data-onboarding="${step.target}"]`);
    if (!target) {
      ui.onboardingIndex += 1;
      renderOnboardingStep();
      return;
    }
    target.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'center' });
    document.querySelector('.onboarding-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = `
      <button class="onboarding-spotlight" type="button" data-action="onboarding-next" aria-label="Продолжить обучение"></button>
      <section class="onboarding-tooltip" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div class="onboarding-progress">${ONBOARDING_STEPS.map((_, index) => `<i class="${index === ui.onboardingIndex ? 'is-active' : ''}"></i>`).join('')}</div>
        <h2 id="onboarding-title">${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.description)}</p>
        <div class="onboarding-actions">
          <button class="btn btn--ghost btn--small" type="button" data-action="onboarding-skip">Пропустить</button>
          <div class="onboarding-actions__nav">
            ${ui.onboardingIndex > 0 ? '<button class="btn btn--secondary btn--small" type="button" data-action="onboarding-back">Назад</button>' : ''}
            <button class="btn btn--primary btn--small" type="button" data-action="onboarding-next">${ui.onboardingIndex === ONBOARDING_STEPS.length - 1 ? 'Готово' : 'Далее'}</button>
          </div>
        </div>
      </section>
    `;
    document.body.append(overlay);
    window.setTimeout(() => {
      positionOnboarding();
      overlay.querySelector('[data-action="onboarding-next"]:last-child')?.focus();
    }, 80);
  }

  function positionOnboarding() {
    if (ui.onboardingIndex < 0) return;
    const step = ONBOARDING_STEPS[ui.onboardingIndex];
    const target = document.querySelector(`[data-onboarding="${step.target}"]`);
    const spotlight = document.querySelector('.onboarding-spotlight');
    const tooltip = document.querySelector('.onboarding-tooltip');
    if (!target || !spotlight || !tooltip) return;

    const rect = target.getBoundingClientRect();
    const pad = 8;
    spotlight.style.top = `${Math.max(6, rect.top - pad)}px`;
    spotlight.style.left = `${Math.max(6, rect.left - pad)}px`;
    spotlight.style.width = `${Math.min(window.innerWidth - 12, rect.width + pad * 2)}px`;
    spotlight.style.height = `${Math.min(window.innerHeight - 12, rect.height + pad * 2)}px`;

    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 16;
    let top = rect.bottom + margin;
    if (top + tooltipRect.height > window.innerHeight - margin) top = rect.top - tooltipRect.height - margin;
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function stopOnboarding(saveCompletion, restoreFocus) {
    clearTimeout(ui.onboardingTimer);
    ui.onboardingTimer = null;
    document.querySelector('.onboarding-overlay')?.remove();
    if (ui.onboardingResizeHandler) {
      window.removeEventListener('resize', ui.onboardingResizeHandler);
      window.removeEventListener('scroll', ui.onboardingResizeHandler, true);
      ui.onboardingResizeHandler = null;
    }
    const wasActive = ui.onboardingIndex >= 0;
    ui.onboardingIndex = -1;
    app.inert = false;
    if (saveCompletion && wasActive) {
      persist(core.setOnboarding(state, true).state);
      showToast('Обучение завершено. Его можно повторить в Профиле.', 'success');
    }
    const returnFocus = ui.onboardingReturnFocus;
    ui.onboardingReturnFocus = null;
    if (wasActive && restoreFocus !== false) {
      if (returnFocus?.isConnected && returnFocus !== document.body) {
        returnFocus.focus();
      } else {
        const heading = app.querySelector('h1');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      }
    }
  }

  function nextOnboarding() {
    if (ui.onboardingIndex >= ONBOARDING_STEPS.length - 1) {
      stopOnboarding(true);
      return;
    }
    ui.onboardingIndex += 1;
    renderOnboardingStep();
  }

  function previousOnboarding() {
    if (ui.onboardingIndex <= 0) return;
    ui.onboardingIndex -= 1;
    renderOnboardingStep();
  }

  function handleAction(button, event) {
    const action = button.dataset.action;
    if (!action) return false;

    switch (action) {
      case 'toggle-theme': toggleTheme(); break;
      case 'set-theme': setTheme(button.dataset.theme); break;
      case 'skip-content': {
        const main = document.getElementById('main-content');
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          main.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
        }
        break;
      }
      case 'enter-demo': closeModal(); enterDemo('dashboard'); break;
      case 'start-purchase': {
        const selection = core.setPurchaseSelection(state, button.dataset.tariff || 'base', state.selectedMonths);
        persist(selection.state);
        enterDemo('purchase');
        break;
      }
      case 'scroll-section': scrollToSection(button.dataset.target, false); break;
      case 'modal-scroll': scrollToSection(button.dataset.target, true); break;
      case 'open-landing-menu': openLandingMenu(); break;
      case 'open-drawer': openDrawer(); break;
      case 'close-drawer': closeDrawer(); break;
      case 'close-modal': closeModal(); break;
      case 'backdrop-close': if (event.target === button) closeModal(); break;
      case 'toggle-faq': toggleFaq(button); break;
      case 'select-tariff': {
        applyResult(core.setPurchaseSelection(state, button.dataset.tariff, state.selectedMonths), { toast: false });
        break;
      }
      case 'select-period': {
        applyResult(core.setPurchaseSelection(state, state.selectedTariffId, Number(button.dataset.months)), { toast: false });
        break;
      }
      case 'purchase': {
        const result = core.purchase(state, state.selectedTariffId, state.selectedMonths, new Date().toISOString());
        if (result.ok) {
          applyResult(result, { renderAfter: false });
          navigate('subscriptions');
        } else if (result.code === 'INSUFFICIENT_BALANCE') {
          openInsufficientModal(result);
        } else {
          showToast(result.message, 'error');
        }
        break;
      }
      case 'toggle-history': ui.historyExpanded = !ui.historyExpanded; render(); break;
      case 'copy': copyText(button.dataset.value || ''); break;
      case 'share-referral': shareReferral(button.dataset.value || state.referral.cabinetLink); break;
      case 'open-ticket-modal': openTicketModal(); break;
      case 'select-ticket': ui.selectedTicketId = button.dataset.ticket; render(); break;
      case 'info-tab': {
        ui.infoTab = Object.hasOwn(INFO_TABS, button.dataset.tab) ? button.dataset.tab : 'faq';
        render();
        window.requestAnimationFrame(() => document.getElementById(`info-tab-${ui.infoTab}`)?.focus());
        break;
      }
      case 'open-info-tab': ui.infoTab = button.dataset.tab; enterDemo('info'); break;
      case 'open-connection': openConnectionModal(); break;
      case 'connection-platform': ui.connectionPlatform = button.dataset.platform; openConnectionModal(true); break;
      case 'download-demo-config': downloadDemoConfig(); break;
      case 'replay-onboarding': {
        persist(core.setOnboarding(state, false).state);
        navigate('dashboard');
        ui.onboardingTimer = window.setTimeout(() => startOnboarding(true), 350);
        break;
      }
      case 'onboarding-next': nextOnboarding(); break;
      case 'onboarding-back': previousOnboarding(); break;
      case 'onboarding-skip': stopOnboarding(true); break;
      case 'confirm-reset': openResetModal(); break;
      case 'reset-demo': {
        state = core.resetState();
        try { localStorage.setItem(core.STORAGE_KEY, JSON.stringify(state)); } catch (_error) { /* optional storage */ }
        closeModal();
        applyTheme();
        navigate('welcome');
        showToast('Демо-данные сброшены.', 'success');
        break;
      }
      case 'logout': {
        const result = core.setSession(state, false);
        persist(result.state);
        navigate('welcome');
        showToast('Вы вышли из демо-кабинета.', 'success');
        break;
      }
      default: return false;
    }
    return true;
  }

  function toggleFaq(button) {
    const item = button.closest('.faq-item, .accordion-item');
    if (!item) return;
    const panel = item.querySelector('.faq-item__panel, .accordion-panel');
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  }

  function handleForm(form) {
    const data = new FormData(form);
    switch (form.dataset.form) {
      case 'promo': {
        const result = core.applyPromo(state, data.get('code'), new Date().toISOString());
        if (applyResult(result)) form.reset();
        break;
      }
      case 'topup': {
        const result = core.topUp(state, data.get('amount'), data.get('method'), new Date().toISOString());
        applyResult(result);
        break;
      }
      case 'create-ticket': {
        const file = form.querySelector('[name="attachment"]')?.files?.[0];
        const result = core.createTicket(state, { subject: data.get('subject'), message: data.get('message'), attachmentName: file?.name || '' }, new Date().toISOString());
        if (result.ok) {
          ui.selectedTicketId = result.ticket.id;
          persist(result.state);
          closeModal();
          navigate('support');
          showToast(result.message, 'success');
        } else showToast(result.message, 'error');
        break;
      }
      case 'ticket-reply': {
        const result = core.replyTicket(state, form.dataset.ticket, data.get('message'), new Date().toISOString());
        if (applyResult(result)) form.reset();
        break;
      }
      case 'email': {
        const result = core.linkEmail(state, data.get('email'));
        applyResult(result);
        break;
      }
      default: break;
    }
  }

  function focusableElements(container) {
    return Array.from(container.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
  }

  function trapFocus(event, container) {
    const focusable = focusableElements(container);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleTabKey(event) {
    const current = event.target.closest?.('[role="tab"]');
    if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return false;
    const tablist = current.closest('[role="tablist"]');
    const tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
    if (!tabs.length) return false;
    const index = tabs.indexOf(current);
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[nextIndex].click();
    return true;
  }

  function focusMainHeading() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const target = main.querySelector('h1') || main;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (liveRegion) liveRegion.textContent = document.title;
  }

  function handleKeyboard(event) {
    if (handleTabKey(event)) return;

    if (event.key === 'Escape') {
      if (document.querySelector('.onboarding-overlay')) {
        stopOnboarding(true);
        return;
      }
      if (modalRoot.firstElementChild) {
        closeModal();
        return;
      }
      if (ui.drawerOpen) {
        closeDrawer();
        return;
      }
    }

    if (event.key === 'Tab') {
      const modal = modalRoot.querySelector('[data-modal-panel]');
      const onboarding = document.querySelector('.onboarding-tooltip');
      const drawer = ui.drawerOpen ? app.querySelector('.mobile-drawer') : null;
      if (modal) trapFocus(event, modal);
      else if (onboarding) trapFocus(event, onboarding);
      else if (drawer) trapFocus(event, drawer);
    }
  }

  document.addEventListener('click', (event) => {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      navigate(routeButton.dataset.route);
      return;
    }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton?.dataset.action === 'backdrop-close' && event.target !== actionButton) return;
    if (actionButton) {
      event.preventDefault();
      handleAction(actionButton, event);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    handleForm(form);
  });

  document.addEventListener('change', (event) => {
    const notification = event.target.closest('[data-notification]');
    if (notification) {
      applyResult(core.setNotification(state, notification.dataset.notification, notification.checked), { toast: false });
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-topup-input], [data-topup-range]')) {
      const value = Math.max(100, Math.min(50000, Number(event.target.value) || 100));
      ui.topUpAmount = value;
      const input = document.querySelector('[data-topup-input]');
      const range = document.querySelector('[data-topup-range]');
      if (input && event.target !== input) input.value = value;
      if (range && event.target !== range) range.value = value;
      const button = event.target.closest('form')?.querySelector('button[type="submit"]');
      if (button) button.textContent = `Зачислить ${formatMoney(value)} в демо`;
    }
  });

  document.addEventListener('keydown', handleKeyboard);
  window.addEventListener('hashchange', () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    render();
    window.requestAnimationFrame(focusMainHeading);
  });
  window.addEventListener('scroll', () => {
    document.querySelector('[data-landing-header]')?.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

  window.SuetaMvp = Object.freeze({
    navigate,
    openModal,
    closeModal,
    showToast,
    resetDemo() {
      state = core.resetState();
      persist(state);
      navigate('welcome');
    },
    getState() {
      return JSON.parse(JSON.stringify(state));
    },
  });

  applyTheme();
  if (!window.location.hash) {
    window.location.hash = '#/welcome';
  } else {
    render();
  }
})();
