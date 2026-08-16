import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';

interface OnboardingProps {
  onComplete: () => Promise<void> | void;
  open: boolean;
}

interface Geometry {
  spotlight: { height: number; left: number; top: number; width: number };
  tooltip: { left: number; top: number };
}

const STEPS = [
  {
    descriptionKey: 'onboarding.steps.navigation.description',
    target: '[data-onboarding-target="navigation"]',
    titleKey: 'onboarding.steps.navigation.title',
  },
  {
    descriptionKey: 'onboarding.steps.subscription.description',
    target: '[data-onboarding-target="subscription"]',
    titleKey: 'onboarding.steps.subscription.title',
  },
  {
    descriptionKey: 'onboarding.steps.notifications.description',
    target: '[data-onboarding-target="notifications"]',
    titleKey: 'onboarding.steps.notifications.title',
  },
] as const;

const EDGE = 12;
const GAP = 16;
const SPOTLIGHT_PADDING = 8;

function selectTarget(selector: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const visible = candidates.find((candidate) => {
    const rectangle = candidate.getBoundingClientRect();
    return rectangle.width > 0 && rectangle.height > 0;
  });
  return visible ?? document.getElementById('main-content');
}

function sameGeometry(current: Geometry | null, next: Geometry): boolean {
  return current?.spotlight.height === next.spotlight.height
    && current.spotlight.left === next.spotlight.left
    && current.spotlight.top === next.spotlight.top
    && current.spotlight.width === next.spotlight.width
    && current.tooltip.left === next.tooltip.left
    && current.tooltip.top === next.tooltip.top;
}

export function Onboarding({ onComplete, open }: OnboardingProps): JSX.Element | null {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [ready, setReady] = useState(false);
  const tooltipRef = useRef<HTMLElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const step = STEPS[stepIndex];

  useLayoutEffect(() => {
    if (!open) return;
    setReady(false);
    const target = selectTarget(step.target);
    const tooltip = tooltipRef.current;
    if (!target || !tooltip) return;

    const measure = () => {
      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      if (targetRect.width <= 0 || targetRect.height <= 0 || tooltipRect.width <= 0 || tooltipRect.height <= 0) {
        setReady(false);
        return;
      }

      const spotlight = {
        height: targetRect.height + (SPOTLIGHT_PADDING * 2),
        left: Math.max(EDGE, targetRect.left - SPOTLIGHT_PADDING),
        top: Math.max(EDGE, targetRect.top - SPOTLIGHT_PADDING),
        width: targetRect.width + (SPOTLIGHT_PADDING * 2),
      };
      let tooltipTop = targetRect.bottom + GAP;
      if (tooltipTop + tooltipRect.height > window.innerHeight - EDGE) {
        tooltipTop = targetRect.top - tooltipRect.height - GAP;
      }
      const tooltipLeft = Math.min(
        Math.max(EDGE, targetRect.left),
        Math.max(EDGE, window.innerWidth - tooltipRect.width - EDGE),
      );
      const nextGeometry: Geometry = {
        spotlight,
        tooltip: { left: tooltipLeft, top: Math.max(EDGE, tooltipTop) },
      };
      setGeometry((current) => (sameGeometry(current, nextGeometry) ? current : nextGeometry));
      setReady(true);
    };

    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(target);
    observer?.observe(tooltip);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, step.target]);

  useEffect(() => {
    if (ready) primaryActionRef.current?.focus();
  }, [ready, stepIndex]);

  if (!open) return null;

  const tooltipStyle: CSSProperties = {
    left: geometry ? `${geometry.tooltip.left}px` : '-9999px',
    top: geometry ? `${geometry.tooltip.top}px` : '-9999px',
    visibility: ready ? 'visible' : 'hidden',
  };
  const spotlightStyle: CSSProperties = {
    height: geometry ? `${geometry.spotlight.height}px` : '0px',
    left: geometry ? `${geometry.spotlight.left}px` : '-9999px',
    top: geometry ? `${geometry.spotlight.top}px` : '-9999px',
    visibility: ready ? 'visible' : 'hidden',
    width: geometry ? `${geometry.spotlight.width}px` : '0px',
  };
  const lastStep = stepIndex === STEPS.length - 1;

  return createPortal(
    <div className="onboarding" data-ready={ready} data-testid="onboarding-overlay">
      <div aria-label={t('onboarding.accessibility.spotlight')} className="onboarding__spotlight" style={spotlightStyle} />
      <section
        ref={tooltipRef}
        aria-label={t('onboarding.title')}
        aria-modal="true"
        className="onboarding__tooltip"
        role="dialog"
        style={tooltipStyle}
      >
        <p className="onboarding__progress">{t('onboarding.progress', { amount: stepIndex + 1, name: STEPS.length })}</p>
        <h2>{t(step.titleKey)}</h2>
        <p>{t(step.descriptionKey)}</p>
        <div className="onboarding__actions">
          {stepIndex > 0 ? (
            <Button onClick={() => setStepIndex((current) => current - 1)} variant="utility">
              {t('onboarding.actions.back')}
            </Button>
          ) : null}
          <Button onClick={() => void onComplete()} variant="ghost">{t('onboarding.actions.skip')}</Button>
          <Button
            ref={primaryActionRef}
            onClick={() => {
              if (lastStep) void onComplete();
              else setStepIndex((current) => current + 1);
            }}
          >
            {t(lastStep ? 'onboarding.actions.finish' : 'onboarding.actions.next')}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
