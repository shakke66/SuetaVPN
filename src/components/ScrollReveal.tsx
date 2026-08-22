import { createElement, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type JSX, type ReactNode } from 'react';

type RevealTag = 'article' | 'div' | 'footer' | 'li' | 'section';

export interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  as?: RevealTag;
  children: ReactNode;
  delay?: number;
}

/** Reveals one block once, when it enters the viewport. */
export function ScrollReveal({
  as = 'div',
  children,
  className,
  delay = 0,
  style,
  ...attributes
}: ScrollRevealProps): JSX.Element {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (typeof IntersectionObserver !== 'function') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const mergedClassName = ['scroll-reveal', visible ? 'is-visible' : '', className]
    .filter(Boolean)
    .join(' ');
  const mergedStyle = {
    ...style,
    '--reveal-delay': `${delay}ms`,
  } as CSSProperties;

  return createElement(
    as,
    {
      ...attributes,
      className: mergedClassName,
      'data-reveal-state': visible ? 'visible' : 'pending',
      ref: nodeRef,
      style: mergedStyle,
    },
    children,
  );
}
