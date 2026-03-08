import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

const helper = `
// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion
`;

function upsertHelperAfterImports(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  // keep existing helper if present
  if (s.includes('// #region agent log') && s.includes('__agentLog')) return s;
  const importMatches = [...s.matchAll(/^import[^;]*;\s*$/gm)];
  if (importMatches.length === 0) return s;
  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  return s.slice(0, insertAt) + helper + s.slice(insertAt);
}

function patchPlanWidgetScrollLogs() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\PlanWidget.tsx';
  let s = fs.readFileSync(p,'utf8');

  // ensure React import includes useEffect/useRef
  s = s.replace(/import React, \{([^}]*)\} from 'react';/, (m, inner) => {
    const parts = inner.split(',').map(x=>x.trim()).filter(Boolean);
    for (const need of ['useEffect','useRef']) {
      if (!parts.includes(need)) parts.push(need);
    }
    return `import React, { ${parts.join(', ')} } from 'react';`;
  });

  s = upsertHelperAfterImports(p);

  if (!s.includes('const planBodyRef')) {
    s = s.replace(/\}\) => \{\n/, m => m + "  const planBodyRef = useRef<HTMLDivElement>(null);\n");
  }

  if (!s.includes('PlanWidget.tsx:scrollMetrics')) {
    s = s.replace(/__agentLog\('H1','PlanWidget\.tsx:render'[\s\S]*?\);\n/, (m) => {
      return m + `
  useEffect(() => {
    const el = planBodyRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    __agentLog('H1','PlanWidget.tsx:scrollMetrics','plan body scroll metrics',{
      overflow: cs.overflow,
      overflowY: cs.overflowY,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      canScroll: el.scrollHeight > el.clientHeight
    });
  });
`;
    });
  }

  // attach ref to plan body container
  s = s.replace(
    /<div className="flex-1 relative bg-gray-100 overflow-hidden" style=\{\{ minHeight: 0 \}\}>/,
    '<div ref={planBodyRef} className="flex-1 relative bg-gray-100 overflow-hidden" style={{ minHeight: 0 }}>'
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched PlanWidget scroll logs');
}

function patchAiHelpersLogs() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app-v2\\utils\\aiHelpers.ts';
  let s = fs.readFileSync(p,'utf8');
  s = upsertHelperAfterImports(p);

  // Insert key presence log right after partialText guard in getAutocompleteSuggestion
  if (!s.includes('aiHelpers.ts:autocomplete:hasKey')) {
    s = s.replace(
      /if \(!partialText \|\| partialText\.length < 2\) return "";\n\n/, 
      (m) => m + "  __agentLog('H2','aiHelpers.ts:autocomplete:hasKey','autocomplete key check',{hasKey: !!process.env.API_KEY, keyLen: (process.env.API_KEY||'').length});\n\n"
    );
  }

  // Log before request
  if (!s.includes('aiHelpers.ts:autocomplete:request')) {
    s = s.replace(
      /try \{\n\s*const response = await ai\.models\.generateContent\(/,
      (m) => "  __agentLog('H2','aiHelpers.ts:autocomplete:request','autocomplete request',{model:'gemini-3-flash-preview', textLen: partialText.length});\n\n" + m
    );
  }

  // Log catch
  if (!s.includes('aiHelpers.ts:autocomplete:error')) {
    s = s.replace(
      /catch \(e\) \{\n\s*console\.error\("Autocomplete Error:", e\);/, 
      (m) => "catch (e) {\n    __agentLog('H2','aiHelpers.ts:autocomplete:error','autocomplete error',{name: (e && e.name) ? e.name : typeof e, message: (e && e.message) ? e.message : String(e)});\n    console.error(\"Autocomplete Error:\", e);"
    );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched aiHelpers logs');
}

patchPlanWidgetScrollLogs();
patchAiHelpersLogs();
