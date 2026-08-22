import { useEffect, useRef } from 'react';
import { LandingPage } from 'suetavpn';

/**
 * Лендинг целиком.
 *
 * Секции ниже первого экрана появляются один раз при попадании в область
 * просмотра. В карточке превью прокрутки нет, поэтому они остались бы
 * невидимыми — здесь они сразу приводятся в конечное состояние, чтобы страница
 * была видна полностью. Компонент при этом настоящий, подменяется только
 * состояние появления.
 */
export const Screen = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('.scroll-reveal').forEach((node) => {
      node.classList.add('is-visible');
      node.dataset.revealState = 'visible';
    });
  }, []);

  return (
    <div ref={ref}>
      <LandingPage />
    </div>
  );
};
