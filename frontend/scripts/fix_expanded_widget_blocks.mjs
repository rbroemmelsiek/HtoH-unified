import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

function ensureLogHelperAfterImports(s) {
  if (s.includes('// #region agent log') && s.includes('__agentLog')) return s;
  const helper = `\n// #region agent log\nconst __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {\n  try {\n    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});\n  } catch (_) {}\n};\n// #endregion\n`;
  const importMatches = [...s.matchAll(/^import[^;]*;\s*$/gm)];
  if (!importMatches.length) return s;
  const last = importMatches[importMatches.length-1];
  const insertAt = last.index + last[0].length;
  return s.slice(0, insertAt) + helper + s.slice(insertAt);
}

function patchExpandedWidgetPanel() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\ExpandedWidgetPanel.tsx';
  let s = fs.readFileSync(p,'utf8');
  s = ensureLogHelperAfterImports(s);

  if (!s.includes("{type === 'academy'")) {
    // Insert just before the closing wrappers (before the inner container closes)
    const marker = '          {type === \'plan\' && (';
    const idx = s.indexOf(marker);
    if (idx === -1) {
      throw new Error('Could not find insertion point for academy/kindle blocks');
    }

    // Find the end of the plan block by locating the next line that starts with "          )}" after idx
    const afterPlanIdx = s.indexOf('          )}', idx);
    if (afterPlanIdx === -1) {
      throw new Error('Could not locate end of plan block');
    }

    const insertAt = afterPlanIdx + '          )}'.length;
    const addition = `

          {type === 'academy' && (
             <AiAcademyWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
             />
          )}

          {type === 'kindle' && (
             <KindleWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
             />
          )}
`;

    s = s.slice(0, insertAt) + addition + s.slice(insertAt);
  }

  // Ensure we log each render type
  if (!s.includes('ExpandedWidgetPanel.tsx:renderType')) {
    s = s.replace(/export const ExpandedWidgetPanel[^=]*= \(\{ type, onClose, config, initialData, instanceKey \}\) => \{\n/, (m) => m + "  __agentLog('H7','ExpandedWidgetPanel.tsx:renderType','render expanded widget',{type});\n");
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('ExpandedWidgetPanel patched with academy/kindle render blocks');
}

patchExpandedWidgetPanel();
