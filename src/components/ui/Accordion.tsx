import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen }: { items: AccordionItem[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const baseId = useId();
  return (
    <div className="divide-y divide-ink-800 rounded-2xl border border-ink-800">
      {items.map((item) => {
        const isOpen = open === item.id;
        const btnId = `${baseId}-${item.id}-btn`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3 className="text-base">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-white hover:text-nova-200"
              >
                {item.title}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-ink-400 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-ink-300">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
