import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

function writeFile(p, contents){
  fs.mkdirSync(p.split('\\').slice(0,-1).join('\\'), {recursive:true});
  fs.writeFileSync(p, contents, 'utf8');
}

function patchTypes() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\types.ts';
  let s = fs.readFileSync(p,'utf8');
  if (!s.includes("'academy_hub'")) {
    s = s.replace(
      /export type ExpandedWidgetType = ([^;]*);/,
      "export type ExpandedWidgetType = 'calendar' | 'maps' | 'places' | 'youtube' | 'graph' | 'forms' | 'contacts' | 'plan' | 'academy' | 'academy_hub' | 'kindle' | null;"
    );
  }
  fs.writeFileSync(p,s,'utf8');
}

function patchAppMenu() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\App.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Add icon
  if (!s.includes('LayoutGrid')) {
    s = s.replace(/import \{ ([^}]*) \} from 'lucide-react';/, (m, inner) => {
      const parts = inner.split(',').map(x=>x.trim()).filter(Boolean);
      if (!parts.includes('LayoutGrid')) parts.push('LayoutGrid');
      return `import { ${parts.join(', ')} } from 'lucide-react';`;
    });
  }

  // Add menu item under Summon Widget list
  if (!s.includes("label: 'Ai Hub'")) {
    s = s.replace(
      /\{ icon: BookOpen, label: 'Ai Academy', tool: 'Ai Academy' \ },\n\s*\{ icon: BookText, label: 'Kindle PDF', tool: 'Kindle PDF' \ }/,
      "{ icon: BookOpen, label: 'Ai Academy', tool: 'Ai Academy' },\n            { icon: LayoutGrid, label: 'Ai Hub', tool: 'Ai Hub' },\n            { icon: BookText, label: 'Kindle PDF', tool: 'Kindle PDF' }"
    );
  }

  // Add handleSimulateTool branches
  if (!s.includes("toolName.includes('Ai Hub')")) {
    s = s.replace(
      /else if \(toolName\.includes\('Kindle'\)\) \{[\s\S]*?setExpandedInstance\(prev => prev \+ 1\);\n\s*\}/,
      (m) => m + "\n    else if (toolName.includes('Ai Hub')) {\n      responseText = `Opening Ai Hub. [[WIDGET:AcademyHub]]`;\n      __agentLog('H7','App.tsx:openWidget','open academy hub from menu',{});\n      setExpandedWidget('academy_hub');\n      setExpandedWidgetData({ agentId: currentAgent.id, agentName: currentAgent.name });\n      setExpandedInstance(prev => prev + 1);\n    }"
    );
  }

  fs.writeFileSync(p,s,'utf8');
}

function patchExpandedWidgetPanel() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\ExpandedWidgetPanel.tsx';
  let s = fs.readFileSync(p,'utf8');

  // Import hub widget
  if (!s.includes('AiAcademyHubWidget')) {
    s = s.replace(
      /import \{ AiAcademyWidget \} from '\.\/AiAcademyWidget';/,
      "import { AiAcademyWidget } from './AiAcademyWidget';\nimport { AiAcademyHubWidget } from './AiAcademyHubWidget';"
    );
  }

  // Titles
  if (!s.includes("case 'academy_hub'")) {
    s = s.replace(/case 'academy': return 'Ai Academy';/, "case 'academy': return 'Ai Academy';\n      case 'academy_hub': return 'Ai Hub';");
  }

  // full bleed and header rules already cover academy/kindle; add academy_hub
  s = s.replace(/type === 'academy'/g, "type === 'academy' || type === 'academy_hub'");

  // Render block
  if (!s.includes("type === 'academy_hub'")) {
    // Place after academy block
    s = s.replace(
      /\{type === 'academy' \&\& \([\s\S]*?\)\}/m,
      (block) => block + `\n\n          {type === 'academy_hub' && (\n             <AiAcademyHubWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n               agentId={initialData?.agentId}\n               agentName={initialData?.agentName}\n             />\n          )}`
    );
  }

  fs.writeFileSync(p,s,'utf8');
}

function writeHubWidget() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\AiAcademyHubWidget.tsx';
  const contents = `import React, { useEffect, useState } from 'react';\nimport { X, Maximize2, Minimize2 } from 'lucide-react';\nimport DataTable from './ai-academy-v1/components/DataTable';\nimport { MOCK_BOOK_DATA } from './ai-academy-v1/constants';\n\n// #region agent log\nconst __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {\n  try {\n    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});\n  } catch (_) {}\n};\n// #endregion\n\nexport function AiAcademyHubWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string }) {\n  const [isPaid, setIsPaid] = useState(false);\n\n  useEffect(() => {\n    __agentLog('H8','AiAcademyHubWidget.tsx:mount','mount academy hub',{agentId, agentName});\n  }, [agentId, agentName]);\n\n  return (\n    <div className=\"flex flex-col h-full bg-[#0a0a0f]\">\n      <div className=\"flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0\">\n        <div className=\"flex flex-col text-white\">\n          <div className=\"font-semibold\">Ai Hub</div>\n          <div className=\"text-[11px] text-white/70\">Agent: {agentName || agentId || '(unassigned)'} </div>\n        </div>\n        <div className=\"flex items-center gap-2\">\n          {onToggleFullScreen && (\n            <button onClick={onToggleFullScreen} className=\"p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white\" title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}>\n              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}\n            </button>\n          )}\n          <button onClick={onClose} className=\"p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white\" title=\"Close\">\n            <X size={20} />\n          </button>\n        </div>\n      </div>\n\n      <div className=\"flex-1 min-h-0 overflow-hidden bg-[#0a0a0f]\">\n        <DataTable\n          data={MOCK_BOOK_DATA}\n          onSelectPage={() => {}}\n          onJoinLive={() => {}}\n          isPaid={isPaid}\n          onBuyCourse={() => setIsPaid(true)}\n        />\n      </div>\n    </div>\n  );\n}\n`;
  writeFile(p, contents);
}

patchTypes();
patchAppMenu();
patchExpandedWidgetPanel();
writeHubWidget();
console.log('Wired Ai Hub widget');
