import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  fetchDraftRecords,
  getAiGuidesCollectionConfig,
  saveDraftRecord,
  seedDraftFromLive,
} from '../../services/aiGuides/draftService';
import { getPublishPreview, publishDraftToLive } from '../../services/aiGuides/publishService';
import { uploadAiGuidePhoto } from '../../services/aiGuides/storageUpload';
import {
  AiGuideRecord,
  buildAiGuideIndex,
  filterAiGuides,
  paginateAiGuides,
} from '../../services/aiGuides/types';
import { PanelTabs } from './components/PanelTabs';
import { PaginatedList } from './components/PaginatedList';

interface AiGuidesEditorViewProps {
  user: User;
}

const EMPTY_RECORD: AiGuideRecord = {
  id: '',
  Unique_ID: '',
  Guide: '',
  Panel: '',
  Panel_order: null,
  Title: '',
  Paragraph: '',
  YT_Thumb: '',
  Photo: '',
  URL: '',
  YT_Video: '',
  YT_Short: '',
  video_script: '',
  PDFfile: '',
  YT_Embed_Wide: '',
  YT_Embed_Short: '',
  status: 'draft',
};

export function AiGuidesEditorView({ user }: AiGuidesEditorViewProps) {
  const config = getAiGuidesCollectionConfig();
  const [records, setRecords] = useState<AiGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState<AiGuideRecord>(EMPTY_RECORD);

  const reload = async () => {
    setLoading(true);
    setMessage('');
    try {
      const draftRecords = await fetchDraftRecords(config.draftCollection);
      if (draftRecords.length === 0) {
        const seeded = await seedDraftFromLive({
          liveCollection: config.liveCollection,
          draftCollection: config.draftCollection,
          actorUid: user.uid,
          actorEmail: user.email,
        });
        setMessage(`Seeded draft from live collection (${seeded.seeded} records).`);
        const seededRecords = await fetchDraftRecords(config.draftCollection);
        setRecords(seededRecords);
      } else {
        setRecords(draftRecords);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const index = useMemo(() => buildAiGuideIndex(records), [records]);
  const filtered = useMemo(
    () => filterAiGuides(records, selectedGuide, selectedPanel, query),
    [records, selectedGuide, selectedPanel, query]
  );
  const pageData = useMemo(() => paginateAiGuides(filtered, page, 10), [filtered, page]);

  useEffect(() => {
    const active =
      records.find((item) => item.Unique_ID === activeId) || pageData.items[0] || EMPTY_RECORD;
    setDraft(active);
    if (active.Unique_ID) setActiveId(active.Unique_ID);
  }, [records, activeId, pageData.items]);

  const updateDraftField = (field: keyof AiGuideRecord, value: string | number | null) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!draft.Unique_ID || !draft.Guide) {
      setMessage('Unique_ID and Guide are required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await saveDraftRecord(draft, {
        draftCollection: config.draftCollection,
        actorUid: user.uid,
        actorEmail: user.email,
      });
      setMessage(`Saved draft: ${draft.Unique_ID}`);
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!draft.Unique_ID || !draft.Guide) {
      setMessage('Set Unique_ID and Guide before uploading a photo.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const uploaded = await uploadAiGuidePhoto({
        file,
        guide: draft.Guide,
        uniqueId: draft.Unique_ID,
        forceWebp: true,
      });
      const next: AiGuideRecord = {
        ...draft,
        Photo: uploaded.downloadUrl,
        photoStoragePath: uploaded.storagePath,
        photoMimeType: uploaded.mimeType,
        photoUpdatedAt: new Date().toISOString(),
      };
      await saveDraftRecord(next, {
        draftCollection: config.draftCollection,
        actorUid: user.uid,
        actorEmail: user.email,
      });
      setMessage('Photo uploaded and draft updated.');
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMessage('');
    try {
      const preview = await getPublishPreview({
        draftCollection: config.draftCollection,
        liveCollection: config.liveCollection,
      });
      const accepted = window.confirm(
        `Publish draft to live?\n\nCreate: ${preview.createCount}\nUpdate: ${preview.updateCount}\nUnchanged: ${preview.unchangedCount}`
      );
      if (!accepted) return;
      const result = await publishDraftToLive({
        actorUid: user.uid,
        actorEmail: user.email,
        draftCollection: config.draftCollection,
        liveCollection: config.liveCollection,
        publishMetaCollection: config.publishMetaCollection,
      });
      setMessage(
        `Published. Created ${result.createCount}, updated ${result.updateCount}, unchanged ${result.unchangedCount}.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="h-full bg-[#F7F8FC] flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#141D84]">Ai Guides Editor</h2>
            <p className="text-xs text-gray-500">Admin-only draft workflow</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold bg-white"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing || loading}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#141D84] text-white disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
        {message && <div className="mt-2 text-xs text-gray-600">{message}</div>}
      </div>

      <div className="flex-1 min-h-0 p-4 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 overflow-y-auto">
        <div className="space-y-3">
          <select
            value={selectedGuide}
            onChange={(event) => {
              setSelectedGuide(event.target.value);
              setSelectedPanel('ALL');
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">All guides</option>
            {index.guides.map((guide) => (
              <option key={guide} value={guide}>
                {guide}
              </option>
            ))}
          </select>
          <PanelTabs
            panels={selectedGuide ? index.panelsByGuide[selectedGuide] || [] : []}
            selectedPanel={selectedPanel}
            onSelectPanel={(next) => {
              setSelectedPanel(next);
              setPage(1);
            }}
          />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search title, guide, panel..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          />

          <PaginatedList
            items={pageData.items}
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalItems={pageData.totalItems}
            onPageChange={setPage}
            emptyMessage={loading ? 'Loading draft...' : 'No draft records found.'}
            renderItem={(item) => (
              <button
                type="button"
                onClick={() => setActiveId(item.Unique_ID)}
                className={`w-full text-left p-3 ${
                  draft.Unique_ID === item.Unique_ID ? 'bg-[#EEF1FF]' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {item.Title || '(Untitled)'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.Guide} • {item.Panel || 'No panel'}
                </div>
                <div className="text-xs text-gray-400 mt-1">{item.Unique_ID}</div>
              </button>
            )}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 h-fit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Unique_ID"
              value={draft.Unique_ID}
              onChange={(value) => updateDraftField('Unique_ID', value)}
            />
            <Field label="Guide" value={draft.Guide} onChange={(value) => updateDraftField('Guide', value)} />
            <Field label="Panel" value={draft.Panel} onChange={(value) => updateDraftField('Panel', value)} />
            <Field
              label="Panel_order"
              type="number"
              value={draft.Panel_order === null ? '' : String(draft.Panel_order)}
              onChange={(value) => updateDraftField('Panel_order', value === '' ? null : Number(value))}
            />
          </div>

          <Field label="Title" value={draft.Title} onChange={(value) => updateDraftField('Title', value)} />
          <TextArea
            label="Paragraph"
            value={draft.Paragraph}
            onChange={(value) => updateDraftField('Paragraph', value)}
          />
          <TextArea
            label="video_script"
            value={draft.video_script}
            onChange={(value) => updateDraftField('video_script', value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Photo URL" value={draft.Photo} onChange={(value) => updateDraftField('Photo', value)} />
            <Field
              label="YT_Thumb URL"
              value={draft.YT_Thumb}
              onChange={(value) => updateDraftField('YT_Thumb', value)}
            />
            <Field label="URL" value={draft.URL} onChange={(value) => updateDraftField('URL', value)} />
            <Field label="YT_Video" value={draft.YT_Video} onChange={(value) => updateDraftField('YT_Video', value)} />
            <Field label="YT_Short" value={draft.YT_Short} onChange={(value) => updateDraftField('YT_Short', value)} />
            <Field
              label="PDFfile"
              value={draft.PDFfile}
              onChange={(value) => updateDraftField('PDFfile', value)}
            />
            <Field
              label="YT_Embed_Wide"
              value={draft.YT_Embed_Wide}
              onChange={(value) => updateDraftField('YT_Embed_Wide', value)}
            />
            <Field
              label="YT_Embed_Short"
              value={draft.YT_Embed_Short}
              onChange={(value) => updateDraftField('YT_Embed_Short', value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold bg-white cursor-pointer">
              Upload Photo
              <input
                type="file"
                accept="image/webp,image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUploadPhoto(file);
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#141D84] text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500 mb-1">{props.label}</div>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
      />
    </label>
  );
}

function TextArea(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500 mb-1">{props.label}</div>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={5}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
      />
    </label>
  );
}
