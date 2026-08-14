import { useId, useState, type JSX, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface AccordionItem {
  readonly id: string;
  readonly title: ReactNode;
  readonly content: ReactNode;
}

interface AccordionProps {
  readonly items: readonly AccordionItem[];
  readonly defaultOpenIds?: readonly string[];
  readonly ariaLabel?: string;
}

export function Accordion({
  items,
  defaultOpenIds = [],
  ariaLabel,
}: AccordionProps): JSX.Element {
  const instanceId = useId();
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpenIds));

  const toggle = (itemId: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  return (
    <div className="accordion" role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        const triggerId = `${instanceId}-${item.id}-trigger`;
        const panelId = `${instanceId}-${item.id}-panel`;
        return (
          <div className="accordion__item" data-state={open ? 'open' : 'closed'} key={item.id}>
            <div className="accordion__header">
              <button
                aria-controls={panelId}
                aria-expanded={open}
                className="accordion__trigger"
                id={triggerId}
                onClick={() => toggle(item.id)}
                type="button"
              >
                <span className="accordion__title">{item.title}</span>
                <Icon className="accordion__chevron" name="chevron-right" size={20} />
              </button>
            </div>
            <div
              aria-hidden={!open}
              aria-labelledby={triggerId}
              className="accordion__panel"
              data-state={open ? 'open' : 'closed'}
              id={panelId}
              role="region"
            >
              <div className="accordion__panel-inner">
                <div className="accordion__content">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
