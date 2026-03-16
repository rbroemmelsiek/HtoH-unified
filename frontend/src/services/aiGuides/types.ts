export interface AiGuideRecord {
  id: string;
  Unique_ID: string;
  Guide: string;
  Panel: string;
  Panel_order: number | null;
  Title: string;
  Paragraph: string;
  YT_Thumb: string;
  Photo: string;
  URL: string;
  YT_Video: string;
  YT_Short: string;
  video_script: string;
  PDFfile: string;
  YT_Embed_Wide: string;
  YT_Embed_Short: string;
  updatedAt?: string;
  photoStoragePath?: string;
  photoMimeType?: string;
  photoUpdatedAt?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface AiGuideIndex {
  guides: string[];
  panelsByGuide: Record<string, string[]>;
}

export interface AiGuidesPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AiGuidesCacheEnvelope {
  version: string;
  updatedAt: number;
  records: AiGuideRecord[];
}

const PANEL_ORDER: readonly string[] = [
  'ALL',
  'LEAD',
  'CONTACT',
  'MEETING',
  'BUYER',
  'SELLER',
  'ESCROW',
  'CLOSE',
  'CLIENT FOR LIFE',
];

const PANEL_ALIASES: Record<string, string> = {
  LEADS: 'LEAD',
  CONTACTS: 'CONTACT',
  MEETINGS: 'MEETING',
  BUYING: 'BUYER',
  BUY: 'BUYER',
  SELLING: 'SELLER',
  SELL: 'SELLER',
  CLOSING: 'CLOSE',
  CLIENT_FOR_LIFE: 'CLIENT FOR LIFE',
  CLIENTLIFE: 'CLIENT FOR LIFE',
};

const normalizePanelLabel = (value: string): string => {
  const compact = value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();
  return PANEL_ALIASES[compact] || compact;
};

export function normalizeAiGuidePanel(panel: string): string {
  const normalized = normalizePanelLabel(panel || '');
  return normalized || 'ALL';
}

const comparePanels = (a: string, b: string): number => {
  const orderIndexA = PANEL_ORDER.indexOf(a as (typeof PANEL_ORDER)[number]);
  const orderIndexB = PANEL_ORDER.indexOf(b as (typeof PANEL_ORDER)[number]);
  const aKnown = orderIndexA >= 0;
  const bKnown = orderIndexB >= 0;
  if (aKnown && bKnown) return orderIndexA - orderIndexB;
  if (aKnown) return -1;
  if (bKnown) return 1;
  return a.localeCompare(b);
};

const normalizeSortOrder = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeString = (value: unknown): string => String(value ?? '').trim();

export function normalizeAiGuideRecord(
  id: string,
  raw: Record<string, unknown>
): AiGuideRecord | null {
  const uniqueId = normalizeString(raw.Unique_ID || raw.unique_id || raw.uniqueId || id);
  const guide = normalizeString(raw.Guide || raw.guide);
  const panel = normalizeString(raw.Panel || raw.panel);
  const title = normalizeString(raw.Title || raw.title);

  if (!uniqueId || !guide) {
    return null;
  }

  return {
    id,
    Unique_ID: uniqueId,
    Guide: guide,
    Panel: panel,
    Panel_order: normalizeSortOrder(raw.Panel_order),
    Title: title,
    Paragraph: normalizeString(raw.Paragraph || raw.paragraph),
    YT_Thumb: normalizeString(raw.YT_Thumb || raw.yt_thumb),
    Photo: normalizeString(raw.Photo || raw.photo),
    URL: normalizeString(raw.URL || raw.url),
    YT_Video: normalizeString(raw.YT_Video || raw.yt_video),
    YT_Short: normalizeString(raw.YT_Short || raw.yt_short),
    video_script: normalizeString(raw.video_script),
    PDFfile: normalizeString(raw.PDFfile || raw.pdfFile),
    YT_Embed_Wide: normalizeString(raw.YT_Embed_Wide),
    YT_Embed_Short: normalizeString(raw.YT_Embed_Short),
    updatedAt: normalizeString(raw.updatedAt),
    photoStoragePath: normalizeString(raw.photoStoragePath),
    photoMimeType: normalizeString(raw.photoMimeType),
    photoUpdatedAt: normalizeString(raw.photoUpdatedAt),
    status: normalizeString(raw.status) as AiGuideRecord['status'],
  };
}

export function sortAiGuides(records: AiGuideRecord[]): AiGuideRecord[] {
  return [...records].sort((a, b) => {
    const g = a.Guide.localeCompare(b.Guide);
    if (g !== 0) return g;
    const panel = a.Panel.localeCompare(b.Panel);
    if (panel !== 0) return panel;
    const ao = a.Panel_order;
    const bo = b.Panel_order;
    if (ao !== null && bo !== null && ao !== bo) return ao - bo;
    if (ao !== null && bo === null) return -1;
    if (ao === null && bo !== null) return 1;
    const title = a.Title.localeCompare(b.Title);
    if (title !== 0) return title;
    return a.Unique_ID.localeCompare(b.Unique_ID);
  });
}

export function buildAiGuideIndex(records: AiGuideRecord[]): AiGuideIndex {
  const guideSet = new Set<string>();
  const panelMap = new Map<string, Set<string>>();

  records.forEach((record) => {
    if (!record.Guide) return;
    guideSet.add(record.Guide);
    const set = panelMap.get(record.Guide) || new Set<string>();
    if (record.Panel) set.add(normalizeAiGuidePanel(record.Panel));
    panelMap.set(record.Guide, set);
  });

  const guides = Array.from(guideSet).sort((a, b) => a.localeCompare(b));
  const panelsByGuide: Record<string, string[]> = {};
  guides.forEach((guide) => {
    panelsByGuide[guide] = Array.from(panelMap.get(guide) || []).sort(comparePanels);
  });

  return { guides, panelsByGuide };
}

export function filterAiGuides(
  records: AiGuideRecord[],
  guide: string,
  panel: string,
  query: string
): AiGuideRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedPanel = normalizeAiGuidePanel(panel);
  return records.filter((record) => {
    if (guide && record.Guide !== guide) return false;
    if (normalizedPanel && normalizedPanel !== 'ALL' && normalizeAiGuidePanel(record.Panel) !== normalizedPanel) {
      return false;
    }
    if (!normalizedQuery) return true;
    const haystack = [
      record.Title,
      record.Paragraph,
      record.Panel,
      record.Guide,
      record.Unique_ID,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function paginateAiGuides<T>(
  records: T[],
  page: number,
  pageSize: number
): AiGuidesPage<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = records.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  return {
    items: records.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
  };
}
