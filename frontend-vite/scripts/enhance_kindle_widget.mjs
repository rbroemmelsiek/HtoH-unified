import fs from 'fs';

const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\KindleWidget.tsx';
let s = fs.readFileSync(p,'utf8');

// Add a sample PDF URL constant if missing
if (!s.includes('SAMPLE_PDF_URL')) {
  s = s.replace(/import \{ MOCK_BOOK_DATA, INITIAL_SAMPLE_RANGE, DEFAULT_PDF_URL \} from '\.\/ai-academy-v1\/constants';/, (m) => {
    return m + "\n\nconst SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';\n";
  });
}

// Ensure we have pdfFile state and setter already; add a derived displayName
if (!s.includes('pdfLabel')) {
  s = s.replace(/const \[pdfFile, setPdfFile\] = useState<string \| File \| null>\(null\);/, (m) => {
    return m + "\n  const pdfLabel = pdfFile instanceof File ? pdfFile.name : (pdfFile ? 'Sample PDF' : 'None');\n";
  });
}

// Add Clear + Sample buttons and show assigned agent/pdf in header
if (!s.includes('Use Sample')) {
  s = s.replace(
    /<div className=\"flex items-center gap-2\">\n\s*<input ref=\{fileInputRef\} type=\"file\" accept=\"application\/pdf\" className=\"hidden\" onChange=\{handleFileChange\} \/>\n\s*<button onClick=\{handleUploadClick\} className=\"px-3 py-1\.5 rounded-lg bg-white\/15 hover:bg-white\/25 text-white text-xs font-semibold\" title=\"Upload PDF\">Upload<\/button>/m,
    `<div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          <button onClick={() => { __agentLog('H6','KindleWidget.tsx:useSample','use sample pdf',{agentId, agentName}); setPdfFile(SAMPLE_PDF_URL); }} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold" title="Use Sample PDF">Use Sample</button>
          <button onClick={handleUploadClick} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold" title="Upload PDF">Upload</button>
          <button onClick={() => { __agentLog('H6','KindleWidget.tsx:clearPdf','clear pdf',{agentId, agentName}); setPdfFile(null); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold" title="Clear PDF">Clear</button>`
  );
}

// Show current pdf label in header block
if (!s.includes('PDF:')) {
  s = s.replace(
    /<div className=\"text-\[11px\] text-white\/70\">Agent: \{agentName \|\| agentId \|\| \"\(unassigned\)\"\}<\/div>/,
    `<div className="text-[11px] text-white/70">Agent: {agentName || agentId || "(unassigned)"}</div>
          <div className="text-[11px] text-white/70">PDF: {pdfLabel}</div>`
  );
}

// Persist per-agent assignment for non-File PDFs (URLs) so sample sticks per agent
if (!s.includes('localStorage.setItem')) {
  s = s.replace(/__agentLog\('H6','KindleWidget\.tsx:render'[\s\S]*?\);/, (m) => {
    return m + `

  // Persist URL-based selection per agent (File uploads are session-only)
  try {
    if (agentId && typeof pdfFile === 'string') {
      const key = 'htoh_agent_pdf_map_v1';
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[agentId] = { url: pdfFile, updatedAt: Date.now(), agentName: agentName || '' };
      localStorage.setItem(key, JSON.stringify(map));
      __agentLog('H6','KindleWidget.tsx:persist','persist pdf url',{agentId, url: pdfFile});
    }
  } catch (e) {
    __agentLog('H6','KindleWidget.tsx:persistError','persist error',{message: String(e)});
  }
`;
  });
}

// On first render, restore URL selection for agent if available
if (!s.includes('restore pdf url')) {
  // ensure useEffect import
  s = s.replace(/import React, \{ useMemo, useRef, useState \} from 'react';/, "import React, { useEffect, useMemo, useRef, useState } from 'react';");

  s = s.replace(/const \[pdfFile, setPdfFile\] = useState<string \| File \| null>\(null\);/, (m) => {
    return m + `

  useEffect(() => {
    try {
      if (!agentId) return;
      const raw = localStorage.getItem('htoh_agent_pdf_map_v1');
      const map = raw ? JSON.parse(raw) : {};
      const rec = map[agentId];
      if (rec && typeof rec.url === 'string') {
        __agentLog('H6','KindleWidget.tsx:restore','restore pdf url',{agentId, url: rec.url});
        setPdfFile(rec.url);
      }
    } catch (e) {
      __agentLog('H6','KindleWidget.tsx:restoreError','restore error',{message: String(e)});
    }
    // only on agent change
  }, [agentId]);
`;
  });
}

fs.writeFileSync(p,s,'utf8');
console.log('Enhanced KindleWidget: sample/upload/clear + per-agent url persistence');
