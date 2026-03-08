import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

function patchAppOpenWidgetData() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\App.tsx';
  let s = fs.readFileSync(p,'utf8');

  // In the menu-open branches, include agent context
  s = s.replace(
    /setExpandedWidget\('academy'\);\n\s*setExpandedWidgetData\(null\);/,
    "setExpandedWidget('academy');\n      setExpandedWidgetData({ agentId: currentAgent.id, agentName: currentAgent.name });"
  );

  s = s.replace(
    /setExpandedWidget\('kindle'\);\n\s*setExpandedWidgetData\(null\);/,
    "setExpandedWidget('kindle');\n      setExpandedWidgetData({ agentId: currentAgent.id, agentName: currentAgent.name });"
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched App.tsx to pass agent context to academy/kindle');
}

function patchExpandedWidgetPanelPassData() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\ExpandedWidgetPanel.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Pass initialData into widgets
  s = s.replace(
    /<AiAcademyWidget\n\s*onClose=\{onClose\}[\s\S]*?\/>/m,
    `<AiAcademyWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n               agentId={initialData?.agentId}\n               agentName={initialData?.agentName}\n             />`
  );

  s = s.replace(
    /<KindleWidget\n\s*onClose=\{onClose\}[\s\S]*?\/>/m,
    `<KindleWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n               agentId={initialData?.agentId}\n               agentName={initialData?.agentName}\n             />`
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched ExpandedWidgetPanel to pass agent context');
}

function patchAiAcademyWidgetProps() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\AiAcademyWidget.tsx';
  let s = fs.readFileSync(p,'utf8');
  // Add props
  if (!s.includes('agentId')) {
    s = s.replace(
      /export function AiAcademyWidget\(\{ onClose, onToggleFullScreen, isFullScreen \}: \{ onClose: \(\) => void; onToggleFullScreen\?: \(\) => void; isFullScreen\?: boolean \}\)/,
      "export function AiAcademyWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string })"
    );
    s = s.replace(
      /__agentLog\('H5','AiAcademyWidget\.tsx:render','render academy widget',\{isFullScreen: !!isFullScreen\}\);/,
      "__agentLog('H5','AiAcademyWidget.tsx:render','render academy widget',{isFullScreen: !!isFullScreen, agentId, agentName});"
    );
    // show agent context in header
    s = s.replace(
      /<div className=\"flex items-center gap-2 text-white font-semibold\">Ai Academy<\/div>/,
      '<div className="flex flex-col text-white">\n          <div className="font-semibold">Ai Academy</div>\n          <div className="text-[11px] text-white/70">Agent: {agentName || agentId || "(unassigned)"}</div>\n        </div>'
    );
  }
  fs.writeFileSync(p,s,'utf8');
  console.log('Patched AiAcademyWidget to show agent context');
}

function patchKindleWidgetUpload() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\KindleWidget.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Add useRef and hidden file input
  s = s.replace(/import React, \{ useMemo, useState \} from 'react';/, "import React, { useMemo, useRef, useState } from 'react';");

  // Add props
  s = s.replace(
    /export function KindleWidget\(\{ onClose, onToggleFullScreen, isFullScreen \}: \{ onClose: \(\) => void; onToggleFullScreen\?: \(\) => void; isFullScreen\?: boolean \}\)/,
    "export function KindleWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string })"
  );

  // Start with no PDF by default so upload flow is obvious
  s = s.replace(/const \[pdfFile, setPdfFile\] = useState<string \| File \| null>\(DEFAULT_PDF_URL\);/, "const [pdfFile, setPdfFile] = useState<string | File | null>(null);");

  // Insert ref + handler after state declarations
  if (!s.includes('fileInputRef')) {
    s = s.replace(/const \[zoom, setZoom\] = useState\(100\);/, (m) => m + `\n\n  const fileInputRef = useRef<HTMLInputElement>(null);\n\n  const handleUploadClick = () => {\n    __agentLog('H6','KindleWidget.tsx:uploadClick','upload click',{agentId, agentName});\n    fileInputRef.current?.click();\n  };\n\n  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    __agentLog('H6','KindleWidget.tsx:fileSelected','pdf selected',{name: file.name, size: file.size, type: file.type, agentId, agentName});\n    setPdfFile(file);\n  };\n`);
  }

  // Log render includes agent
  s = s.replace(
    /__agentLog\('H6','KindleWidget\.tsx:render','render kindle widget',\{isFullScreen: !!isFullScreen, hasPdf: !!pdfFile, isPaid, currentPage, zoom\}\);/,
    "__agentLog('H6','KindleWidget.tsx:render','render kindle widget',{isFullScreen: !!isFullScreen, hasPdf: !!pdfFile, isPaid, currentPage, zoom, agentId, agentName});"
  );

  // Add agent + upload button in header
  s = s.replace(
    /<div className=\"flex items-center gap-2 text-white font-semibold\">Kindle PDF<\/div>/,
    `<div className="flex flex-col text-white">
          <div className="font-semibold">Kindle PDF</div>
          <div className="text-[11px] text-white/70">Agent: {agentName || agentId || "(unassigned)"}</div>
        </div>`
  );

  // Add upload button + hidden input in header action group
  if (!s.includes('handleUploadClick')) {
    // already inserted
  }
  if (!s.includes('Upload PDF')) {
    s = s.replace(
      /<div className=\"flex items-center gap-2\">\n          \{onToggleFullScreen/m,
      `<div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          <button onClick={handleUploadClick} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold" title="Upload PDF">Upload</button>
          {onToggleFullScreen`
    );
  }

  // Wire onUploadClick to same handler
  s = s.replace(/onUploadClick=\{\(\) => \{ \/\* TODO: add upload \*\/ \}\}/, 'onUploadClick={handleUploadClick}');

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched KindleWidget (agent context + upload)');
}

patchAppOpenWidgetData();
patchExpandedWidgetPanelPassData();
patchAiAcademyWidgetProps();
patchKindleWidgetUpload();
