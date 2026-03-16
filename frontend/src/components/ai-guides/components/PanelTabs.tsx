import React from 'react';

interface PanelTabsProps {
  panels: string[];
  selectedPanel: string;
  onSelectPanel: (panel: string) => void;
}

export function PanelTabs({ panels, selectedPanel, onSelectPanel }: PanelTabsProps) {
  const options = ['ALL', ...panels.filter((panel) => panel && panel !== 'ALL')];
  const activeIndex = Math.max(0, options.indexOf(selectedPanel));

  return (
    <div className="space-y-2">
      <div className="md:hidden">
        <select
          value={selectedPanel}
          onChange={(event) => onSelectPanel(event.target.value)}
          className="w-full rounded-md border border-[#29439f] px-3 py-2 text-sm font-semibold bg-white text-[#141D84]"
        >
          {options.map((panel) => (
            <option key={panel} value={panel}>
              {panel}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden md:block rounded-md border border-[#223a93] bg-[#192f82] px-1 py-1 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-stretch min-w-max">
          {options.map((panel, index) => {
            const active = panel === selectedPanel;
            const isFirst = index === 0;
            const isLast = index === options.length - 1;
            return (
              <button
                key={panel}
                type="button"
                onClick={() => onSelectPanel(panel)}
                className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition border-y border-[#2e469f] ${
                  isFirst ? 'rounded-l-sm border-l' : 'border-l'
                } ${isLast ? 'rounded-r-sm border-r' : ''} ${
                  active
                    ? 'bg-white text-[#141D84]'
                    : 'bg-transparent text-white/90 hover:bg-[#233b96]'
                }`}
                aria-current={active ? 'true' : undefined}
              >
                {panel}
              </button>
            );
          })}
        </div>
        {options.length > 1 && (
          <div
            className="h-0.5 bg-white/40 mt-1 transition-all"
            style={{
              width: `${100 / options.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
