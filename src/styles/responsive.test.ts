import { describe, expect, it } from 'vitest';

import css from './responsive.css?raw';

/** Тело правила по точному селектору: от `{` до парной `}`. */
function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `правило ${selector} не найдено`).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  const end = css.indexOf('}', open);
  return css.slice(open + 1, end);
}

describe('нижняя навигация на телефоне', () => {
  // Панель плавающая: приподнята над краем и скруглена. Безопасная зона у неё
  // одна и уже заложена в `bottom`; добавленная ещё и внутрь (min-height,
  // padding-bottom) она вырастает в пустой хвост под кнопками — это и видно
  // в Telegram Mini App, где inset не нулевой.
  it('учитывает безопасную зону ровно один раз, в отступе от края экрана', () => {
    const body = ruleBody('.bottom-navigation');
    const uses = body.match(/--mobile-safe-bottom/g) ?? [];

    expect(uses).toHaveLength(1);
    expect(body).toMatch(/bottom:\s*calc\([^;]*--mobile-safe-bottom/);
  });

  it('держит одинаковый внутренний отступ сверху и снизу', () => {
    const body = ruleBody('.bottom-navigation');

    expect(body).not.toMatch(/padding-bottom:/);
  });
});
