import React, { useMemo, useState } from 'react';
import { MonitorPlay, Smartphone, X } from 'lucide-react';
import {
  AiGuideRecord,
  buildAiGuideIndex,
  filterAiGuides,
  normalizeAiGuidePanel,
  paginateAiGuides,
} from '../../services/aiGuides/types';
import { GuideGrid } from './components/GuideGrid';
import { PanelTabs } from './components/PanelTabs';
import { PaginatedList } from './components/PaginatedList';

interface AiGuidesRuntimeViewProps {
  records: AiGuideRecord[];
  loading?: boolean;
  onRefresh?: () => void;
}

type VideoFormat = 'wide' | 'short';

interface VideoModalState {
  url: string;
  format: VideoFormat;
  title: string;
}

const sanitizeUrl = (value: string): string => value.trim().replace(/^"|"$/g, '');

const parseIframeSrc = (value: string): string => {
  const trimmed = sanitizeUrl(value);
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  return srcMatch?.[1] ? srcMatch[1] : trimmed;
};

const extractYouTubeVideoId = (value: string): string | null => {
  const parsedValue = parseIframeSrc(value);
  if (!parsedValue) return null;
  try {
    const url = new URL(parsedValue);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/')[2] || null;
    }
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2] || null;
    }
    if (url.searchParams.has('v')) {
      return url.searchParams.get('v');
    }
    return null;
  } catch {
    const match = parsedValue.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=))([^?&#/]+)/i);
    return match?.[1] || null;
  }
};

const toYouTubeEmbedUrl = (value: string, format: VideoFormat): string => {
  const raw = parseIframeSrc(value);
  const videoId = extractYouTubeVideoId(raw);
  if (!videoId) return '';
  const base = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams({
    autoplay: '1',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (format === 'short') {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  return `${base}?${params.toString()}`;
};

const getWideEmbed = (record: AiGuideRecord): string =>
  toYouTubeEmbedUrl(record.YT_Embed_Wide || record.YT_Video || record.URL, 'wide');

const getShortEmbed = (record: AiGuideRecord): string =>
  toYouTubeEmbedUrl(record.YT_Embed_Short || record.YT_Short, 'short');

const getPreviewImage = (record: AiGuideRecord): string => {
  if (record.Photo) return record.Photo;
  if (record.YT_Thumb) return record.YT_Thumb;
  const fallbackVideoId =
    extractYouTubeVideoId(record.YT_Embed_Wide || record.YT_Video || record.YT_Embed_Short || record.YT_Short);
  return fallbackVideoId ? `https://img.youtube.com/vi/${fallbackVideoId}/hqdefault.jpg` : '';
};

export function AiGuidesRuntimeView({ records, loading, onRefresh }: AiGuidesRuntimeViewProps) {
  const [selectedGuide, setSelectedGuide] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState('');
  const [videoModal, setVideoModal] = useState<VideoModalState | null>(null);

  const index = useMemo(() => buildAiGuideIndex(records), [records]);
  const guideCards = useMemo(
    () =>
      index.guides.map((guide) => {
        const guideRows = records.filter((item) => item.Guide === guide);
        const firstPhoto = guideRows.find((item) => item.Photo || item.YT_Thumb);
        return {
          name: guide,
          count: guideRows.length,
          coverPhoto: firstPhoto?.Photo || firstPhoto?.YT_Thumb || '',
        };
      }),
    [index.guides, records]
  );

  const filtered = useMemo(
    () => filterAiGuides(records, selectedGuide, selectedPanel, query),
    [records, selectedGuide, selectedPanel, query]
  );
  const pageData = useMemo(() => paginateAiGuides(filtered, page, 12), [filtered, page]);

  const activeRecord = useMemo(
    () => records.find((record) => record.Unique_ID === activeId) || pageData.items[0] || null,
    [records, activeId, pageData.items]
  );

  const handleGuideSelect = (guide: string) => {
    setSelectedGuide(guide);
    setSelectedPanel('ALL');
    setQuery('');
    setPage(1);
    setActiveId('');
  };

  const handleBackToGuides = () => {
    setSelectedGuide('');
    setSelectedPanel('ALL');
    setQuery('');
    setPage(1);
    setActiveId('');
  };

  return (
    <div className="h-full bg-[#F7F8FC] flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#141D84]">Ai Guides</h2>
            <p className="text-xs text-gray-500">
              {selectedGuide ? `${selectedGuide} ${selectedPanel !== 'ALL' ? `> ${selectedPanel}` : ''}` : 'Guide catalog'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold bg-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loading && (
          <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            Loading latest data...
          </div>
        )}

        {!selectedGuide ? (
          <GuideGrid guides={guideCards} onSelect={handleGuideSelect} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToGuides}
                  className="px-2.5 py-1.5 rounded-md border border-gray-200 text-xs font-semibold bg-white"
                >
                  Back
                </button>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search title, panel, paragraph..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
                />
              </div>

              <PanelTabs
                panels={index.panelsByGuide[selectedGuide] || []}
                selectedPanel={selectedPanel}
                onSelectPanel={(next) => {
                  setSelectedPanel(next);
                  setPage(1);
                }}
              />

              <PaginatedList
                items={pageData.items}
                page={pageData.page}
                totalPages={pageData.totalPages}
                totalItems={pageData.totalItems}
                onPageChange={setPage}
                emptyMessage="No guide items match your filters."
                renderItem={(item) => {
                  const selected = activeRecord?.Unique_ID === item.Unique_ID;
                  const previewImage = getPreviewImage(item);
                  const wideVideo = getWideEmbed(item);
                  const shortVideo = getShortEmbed(item);
                  const hasWideVideo = Boolean(wideVideo);
                  const hasShortVideo = Boolean(shortVideo);
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveId(item.Unique_ID)}
                      className={`w-full text-left p-3 transition ${
                        selected ? 'bg-[#EEF1FF]' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <img
                            src={previewImage}
                            alt={item.Title || item.Unique_ID}
                            className="w-16 h-12 rounded object-cover bg-gray-100"
                          />
                          {(hasWideVideo || hasShortVideo) && (
                            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/25 rounded">
                              {hasWideVideo && <MonitorPlay size={14} className="text-white drop-shadow" />}
                              {hasShortVideo && <Smartphone size={13} className="text-white drop-shadow" />}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {item.Title || '(Untitled)'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.Panel ? normalizeAiGuidePanel(item.Panel) : 'No panel'} {item.Panel_order !== null ? `• #${item.Panel_order}` : ''}
                          </div>
                          {item.Paragraph && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.Paragraph}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                }}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 h-fit xl:sticky xl:top-2">
              {!activeRecord ? (
                <div className="text-sm text-gray-500">Select an item to preview.</div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const previewImage = getPreviewImage(activeRecord);
                    const wideVideo = getWideEmbed(activeRecord);
                    const shortVideo = getShortEmbed(activeRecord);
                    const hasWideVideo = Boolean(wideVideo);
                    const hasShortVideo = Boolean(shortVideo);
                    return (
                      <>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {activeRecord.Guide} • {activeRecord.Panel ? normalizeAiGuidePanel(activeRecord.Panel) : 'No panel'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{activeRecord.Title || '(Untitled)'}</h3>
                  <img
                    src={previewImage}
                    alt={activeRecord.Title || activeRecord.Unique_ID}
                    className="w-full rounded-lg object-cover bg-gray-100 aspect-video"
                  />
                  {(hasWideVideo || hasShortVideo) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {hasWideVideo && (
                        <button
                          type="button"
                          onClick={() =>
                            setVideoModal({
                              url: wideVideo,
                              format: 'wide',
                              title: activeRecord.Title || activeRecord.Unique_ID,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-md bg-[#141D84] text-white px-3 py-2 text-xs font-semibold hover:bg-[#0f1762]"
                        >
                          <MonitorPlay size={14} />
                          Play Video (Wide)
                        </button>
                      )}
                      {hasShortVideo && (
                        <button
                          type="button"
                          onClick={() =>
                            setVideoModal({
                              url: shortVideo,
                              format: 'short',
                              title: activeRecord.Title || activeRecord.Unique_ID,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-md border border-[#141D84] text-[#141D84] px-3 py-2 text-xs font-semibold hover:bg-[#EEF1FF]"
                        >
                          <Smartphone size={14} />
                          Play Video (Short)
                        </button>
                      )}
                    </div>
                  )}
                  {activeRecord.Paragraph && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeRecord.Paragraph}</p>
                  )}
                  <div className="text-xs text-gray-500">ID: {activeRecord.Unique_ID}</div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {videoModal && (
        <div
          className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setVideoModal(null)}
        >
          <div
            className={`relative rounded-xl overflow-hidden bg-black shadow-2xl ${
              videoModal.format === 'short' ? 'w-[min(420px,90vw)] aspect-[9/16]' : 'w-[min(960px,95vw)] aspect-video'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setVideoModal(null)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/45 text-white hover:bg-black/70"
              title="Close video"
            >
              <X size={16} />
            </button>
            <iframe
              src={videoModal.url}
              title={videoModal.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
