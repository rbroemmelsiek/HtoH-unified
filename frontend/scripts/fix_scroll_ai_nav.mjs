import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

function patchPlanWidget() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\PlanWidget.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Ensure hook imports exist
  s = s.replace(/import React, \{([^}]*)\} from 'react';/, (m, inner) => {
    const parts = inner.split(',').map(x=>x.trim()).filter(Boolean);
    for (const need of ['useEffect','useRef']) {
      if (!parts.includes(need)) parts.push(need);
    }
    return `import React, { ${parts.join(', ')} } from 'react';`;
  });

  // If destructured import wasn't found, fall back to adding named imports
  if (!s.includes('useEffect') || !s.includes('useRef')) {
    // no-op; above should have handled it for current file shape
  }

  // Make plan body scrollable
  s = s.replace(
    'className="flex-1 relative bg-gray-100 overflow-hidden"',
    'data-plan-scroll-container="plan-widget" className="flex-1 relative bg-gray-100 overflow-x-hidden overflow-y-auto"'
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched PlanWidget (scroll container + imports)');
}

function patchProgressNav() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app-v2\\components\\ProgressNav.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Inject agent log helper (once)
  if (!s.includes('// #region agent log')) {
    const helper = `\n// #region agent log\nconst __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {\n  try {\n    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});\n  } catch (_) {}\n};\n// #endregion\n`;
    // place after imports
    const importMatches = [...s.matchAll(/^import[^;]*;\s*$/gm)];
    if (importMatches.length) {
      const last = importMatches[importMatches.length-1];
      const insertAt = last.index + last[0].length;
      s = s.slice(0, insertAt) + helper + s.slice(insertAt);
    }
  }

  // Replace window-scroll based scrollToPanel with container-aware logic
  if (!s.includes('data-plan-scroll-container')) {
    s = s.replace(
      /const scrollToPanel = \(eid: string, index: number\) => \{[\s\S]*?\n  \};/m,
`const getScrollContainer = () => {
    // PlanWidget provides the scroll container when embedded
    const el = document.querySelector('[data-plan-scroll-container="plan-widget"]') as HTMLElement | null;
    return el || null;
  };

  const scrollToPanel = (eid: string, index: number) => {
    const scroller = getScrollContainer();

    // Special case for the first panel: scroll to top
    if (index === 0) {
      if (scroller) {
        __agentLog('H1','ProgressNav.tsx:scrollTop','scroll to top (scroller)',{scrollTop: scroller.scrollTop});
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        __agentLog('H1','ProgressNav.tsx:scrollTop','scroll to top (window)',{});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const element = document.getElementById(eid);
    if (!element) {
      __agentLog('H1','ProgressNav.tsx:scrollToPanel','target element missing',{eid});
      return;
    }

    const navHeight = navContainerRef.current?.getBoundingClientRect().height || 55;

    if (scroller) {
      const scrollerRect = scroller.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offsetWithinScroller = (elementRect.top - scrollerRect.top) + scroller.scrollTop;
      const top = Math.max(0, offsetWithinScroller - navHeight - 12);
      __agentLog('H1','ProgressNav.tsx:scrollToPanel','scroll within scroller',{eid,index,navHeight,scrollerScrollTop: scroller.scrollTop,targetTop: top});
      scroller.scrollTo({ top, behavior: 'smooth' });
      return;
    }

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navHeight - 12;
    __agentLog('H1','ProgressNav.tsx:scrollToPanel','scroll within window',{eid,index,navHeight,targetTop: offsetPosition});
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };`
    );
  }

  // Add click logs
  if (!s.includes('ProgressNav.tsx:navClick')) {
    s = s.replace(/const handleNavClick = \(eid: string, index: number\) => \{/, "const handleNavClick = (eid: string, index: number) => {\n    __agentLog('H1','ProgressNav.tsx:navClick','nav click',{eid,index});");
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched ProgressNav (container-aware scrolling + logs)');
}

function patchAiHelpers() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app-v2\\utils\\aiHelpers.ts';
  let s = fs.readFileSync(p,'utf8');

  // getBulkSubtasks key check
  if (!s.includes('aiHelpers.ts:bulk:hasKey')) {
    s = s.replace(/export const getBulkSubtasks = async \(\n  parentRow: PlanRow,\n  plan: PlanDocument\n\): Promise<GeneratedTask\[]> => \{\n/, (m) => m + "  __agentLog('H2','aiHelpers.ts:bulk:hasKey','bulk key check',{hasKey: !!process.env.API_KEY, keyLen: (process.env.API_KEY||'').length, parentEid: parentRow.eid});\n\n");
  }

  if (!s.includes('aiHelpers.ts:bulk:request')) {
    s = s.replace(/try \{\n\s*const response = await ai\.models\.generateContent\(/, (m) => "  __agentLog('H2','aiHelpers.ts:bulk:request','bulk request',{model:'gemini-3-flash-preview', parentEid: parentRow.eid});\n\n" + m);
  }

  if (!s.includes('aiHelpers.ts:bulk:error')) {
    s = s.replace(/catch \(e\) \{\n\s*console\.error\("Bulk Generation Error:", e\);/, (m) => "catch (e) {\n    __agentLog('H2','aiHelpers.ts:bulk:error','bulk error',{name: (e && e.name) ? e.name : typeof e, message: (e && e.message) ? e.message : String(e)});\n    console.error(\"Bulk Generation Error:\", e);" );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched aiHelpers (bulk logs)');
}

function patchViteConfigGeminiKey() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\vite.config.ts';
  let s = fs.readFileSync(p,'utf8');

  // Replace define block to prefer VITE_GEMINI_API_KEY
  s = s.replace(
    /define:\s*\{[\s\S]*?\},\n\s*resolve:/m,
    "define: {\n        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),\n        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)\n      },\n      resolve:"
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched vite.config.ts (Gemini key mapping)');
}

patchPlanWidget();
patchProgressNav();
patchAiHelpers();
patchViteConfigGeminiKey();
