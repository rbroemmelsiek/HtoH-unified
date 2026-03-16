import React from 'react';

interface GuideCardData {
  name: string;
  count: number;
  coverPhoto?: string;
}

interface GuideGridProps {
  guides: GuideCardData[];
  onSelect: (guide: string) => void;
}

export function GuideGrid({ guides, onSelect }: GuideGridProps) {
  if (guides.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No guides available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {guides.map((guide) => (
        <button
          key={guide.name}
          type="button"
          onClick={() => onSelect(guide.name)}
          className="text-left rounded-xl border border-gray-200 bg-white hover:border-[#5972d0] hover:shadow-md transition overflow-hidden"
        >
          <div className="aspect-[16/9] bg-gray-100">
            {guide.coverPhoto ? (
              <img src={guide.coverPhoto} alt={guide.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{guide.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{guide.count} items</p>
          </div>
        </button>
      ))}
    </div>
  );
}
