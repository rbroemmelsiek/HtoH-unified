import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

const logHelper = (runId) => `\n// #region agent log\nconst __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {\n  try {\n    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'${runId}',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});\n  } catch (_) {}\n};\n// #endregion\n`;

function writeFile(p, contents){
  fs.mkdirSync(p.split('\\').slice(0,-1).join('\\'), {recursive:true});
  fs.writeFileSync(p, contents, 'utf8');
}

function patchTypes() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\types.ts';
  let s = fs.readFileSync(p,'utf8');
  s = s.replace(
    /export type ExpandedWidgetType = ([^;]*);/,
    (m, inner) => {
      // if already has academy/kindle, keep
      if (inner.includes("'academy'")) return m;
      return "export type ExpandedWidgetType = 'calendar' | 'maps' | 'places' | 'youtube' | 'graph' | 'forms' | 'contacts' | 'plan' | 'academy' | 'kindle' | null;";
    }
  );
  fs.writeFileSync(p,s,'utf8');
  console.log('Patched ExpandedWidgetType');
}

function patchMessageBubble() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\MessageBubble.tsx';
  let s = fs.readFileSync(p,'utf8');
  if (!s.includes('[[WIDGET:Academy]]')) {
    s = s.replace(/const hasPlanWidget = message\.text\.includes\('\[\[WIDGET:Plan\]\]'\);/, m => m + "\n  const hasAcademyWidget = message.text.includes('[[WIDGET:Academy]]');\n  const hasKindleWidget = message.text.includes('[[WIDGET:Kindle]]');");
    s = s.replace(/const hasWidget = ([^;]*);/, "const hasWidget = hasCalendarWidget || hasMapsWidget || hasPlacesWidget || hasYouTubeWidget || hasGraphWidget || hasFormsWidget || hasContactsWidget || hasPlanWidget || hasAcademyWidget || hasKindleWidget;");
    s = s.replace(/\.replace\('\[\[WIDGET:Plan\]\]'\s*,\s*''\);/, ".replace('[[WIDGET:Plan]]', '')\n    .replace('[[WIDGET:Academy]]', '')\n    .replace('[[WIDGET:Kindle]]', '');");
  }
  fs.writeFileSync(p,s,'utf8');
  console.log('Patched MessageBubble widget tags');
}

function patchAppToolMenu() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\App.tsx';
  let s = fs.readFileSync(p,'utf8');

  // add icons import if not present
  if (!s.includes('BookOpen')) {
    s = s.replace(
      /import \{ ([^}]*) \} from 'lucide-react';/,
      (m, inner) => {
        const parts = inner.split(',').map(x=>x.trim()).filter(Boolean);
        for (const add of ['BookOpen', 'BookText']) {
          if (!parts.includes(add)) parts.push(add);
        }
        return `import { ${parts.join(', ')} } from 'lucide-react';`;
      }
    );
  }

  // Add toolName cases
  if (!s.includes('AI Academy')) {
    s = s.replace(
      /else if \(toolName\.includes\('Plan'\) \|\| toolName\.includes\('Service Plan'\)\) \{\n\s*responseText = `Opening the Service Plan widget\. \[\[WIDGET:Plan\]\]`;/,
      (m) => m + "\n    } else if (toolName.includes('Academy')) {\n      responseText = `Opening Ai Academy. [[WIDGET:Academy]]`;\n    } else if (toolName.includes('Kindle')) {\n      responseText = `Opening Kindle PDF. [[WIDGET:Kindle]]`;"
    );
  }

  // Add summon menu items
  if (!s.includes("Ai Academy")) {
    s = s.replace(
      /\{ icon: BarChart3, label: 'Graph', tool: 'Graph Widget' \ }/,
      "{ icon: BarChart3, label: 'Graph', tool: 'Graph Widget' },\n            { icon: BookOpen, label: 'Ai Academy', tool: 'Ai Academy' },\n            { icon: BookText, label: 'Kindle PDF', tool: 'Kindle PDF' }"
    );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched App tool menu items');
}

function patchExpandedWidgetPanel() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\ExpandedWidgetPanel.tsx';
  let s = fs.readFileSync(p,'utf8');

  // add imports
  if (!s.includes('AiAcademyWidget')) {
    s = s.replace(/import \{ PlanWidget \} from '\.\/PlanWidget';/, "import { PlanWidget } from './PlanWidget';\nimport { AiAcademyWidget } from './AiAcademyWidget';\nimport { KindleWidget } from './KindleWidget';" );
  }

  // titles
  if (!s.includes("case 'academy'")) {
    s = s.replace(/case 'plan': return 'Service Plan';/, "case 'plan': return 'Service Plan';\n      case 'academy': return 'Ai Academy';\n      case 'kindle': return 'Kindle PDF';");
  }

  // full bleed
  s = s.replace(/const isFullBleed = ([^;]*);/, (m, inner) => {
    if (inner.includes("'academy'")) return m;
    return "const isFullBleed = type === 'contacts' || type === 'forms' || type === 'calendar' || type === 'plan' || type === 'academy' || type === 'kindle';";
  });
  s = s.replace(/const showHeader = ([^;]*);/, (m, inner) => {
    if (inner.includes("academy")) return m;
    return "const showHeader = type !== 'contacts' && type !== 'forms' && type !== 'calendar' && type !== 'plan' && type !== 'academy' && type !== 'kindle';";
  });

  // render blocks: insert after plan block
  if (!s.includes("type === 'academy'")) {
    s = s.replace(
      /\{type === 'plan' && \([\s\S]*?\)\}\n\s*\}/m,
      (block) => block.replace(/\}\n\s*\}\n\s*\}/m, "}\n\n          {type === 'academy' && (\n             <AiAcademyWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n             />\n          )}\n\n          {type === 'kindle' && (\n             <KindleWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n             />\n          )}\n        }")
    );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched ExpandedWidgetPanel for academy/kindle');
}

function writeWidgets() {
  const base = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components';

  const academy = `import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import AcademyApp from './ai-academy-v1/App';
${logHelper('pre-fix')}

export function AiAcademyWidget({ onClose, onToggleFullScreen, isFullScreen }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean }) {
  __agentLog('H5','AiAcademyWidget.tsx:render','render academy widget',{isFullScreen: !!isFullScreen});
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold">Ai Academy</div>
        <div className="flex items-center gap-2">
          {onToggleFullScreen && (
            <button onClick={onToggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {/* AcademyApp uses its own full layout; allow it to fill */}
        <AcademyApp />
      </div>
    </div>
  );
}
`;

  const kindle = `import React, { useMemo, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import KindleViewer from './ai-academy-v1/components/KindleViewer';
import { MOCK_BOOK_DATA, INITIAL_SAMPLE_RANGE, DEFAULT_PDF_URL } from './ai-academy-v1/constants';
${logHelper('pre-fix')}

function parseRange(rangeStr: string): number[] {
  const pages: number[] = [];
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((p) => parseInt(p.trim(), 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i);
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!Number.isNaN(p)) pages.push(p);
    }
  }
  return pages;
}

export function KindleWidget({ onClose, onToggleFullScreen, isFullScreen }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean }) {
  const [isPaid, setIsPaid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleRangeRaw] = useState(INITIAL_SAMPLE_RANGE);
  const samplePages = useMemo(() => parseRange(sampleRangeRaw), [sampleRangeRaw]);
  const [pdfFile, setPdfFile] = useState<string | File | null>(DEFAULT_PDF_URL);
  const [allowCopy, setAllowCopy] = useState(false);
  const [zoom, setZoom] = useState(100);

  __agentLog('H6','KindleWidget.tsx:render','render kindle widget',{isFullScreen: !!isFullScreen, hasPdf: !!pdfFile, isPaid, currentPage, zoom});

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold">Kindle PDF</div>
        <div className="flex items-center gap-2">
          {onToggleFullScreen && (
            <button onClick={onToggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <KindleViewer
          data={MOCK_BOOK_DATA}
          isPaid={isPaid}
          currentPage={currentPage}
          samplePages={samplePages}
          onPageChange={setCurrentPage}
          onSetPaid={setIsPaid}
          onShowVideo={() => { /* no-op in widget */ }}
          pdfFile={pdfFile}
          onUploadClick={() => { /* TODO: add upload */ }}
          isFullscreen={!!isFullScreen}
          onToggleFullscreen={onToggleFullScreen}
          allowCopy={allowCopy}
          zoom={zoom}
          onZoomChange={setZoom}
          isChatVisible={false}
        />
      </div>
    </div>
  );
}
`;

  writeFile(`${base}\\AiAcademyWidget.tsx`, academy);
  writeFile(`${base}\\KindleWidget.tsx`, kindle);
  console.log('Wrote AiAcademyWidget.tsx and KindleWidget.tsx');
}

patchTypes();
patchMessageBubble();
patchAppToolMenu();
patchExpandedWidgetPanel();
writeWidgets();
