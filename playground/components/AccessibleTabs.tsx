import { useId, useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  content: string;
}

interface AccessibleTabsProps {
  items: TabItem[];
}

export function AccessibleTabs({ items }: AccessibleTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const active = items[activeIndex];

  const move = (nextIndex: number) => {
    const index = (nextIndex + items.length) % items.length;
    setActiveIndex(index);
    requestAnimationFrame(() => document.getElementById(`${listId}-tab-${items[index].id}`)?.focus());
  };

  return (
    <div className="play-tabs">
      <div className="play-tablist" role="tablist" aria-label="Playground examples">
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.id}
              id={`${listId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${listId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'play-tab is-selected' : 'play-tab'}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') { event.preventDefault(); move(index + 1); }
                if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1); }
                if (event.key === 'Home') { event.preventDefault(); move(0); }
                if (event.key === 'End') { event.preventDefault(); move(items.length - 1); }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${listId}-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`${listId}-tab-${active.id}`}
        tabIndex={0}
        className="play-tabpanel"
      >
        {active.content}
      </div>
    </div>
  );
}
