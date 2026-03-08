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

  // Add imports if missing
  if (!s.includes("AiAcademyWidget")) {
    s = s.replace(
      "import { PlanWidget } from './PlanWidget';",
      "import { PlanWidget } from './PlanWidget';\nimport { AiAcademyWidget } from './AiAcademyWidget';\nimport { KindleWidget } from './KindleWidget';"
    );
  }

  // Log which widget is being rendered
  if (!s.includes('ExpandedWidgetPanel.tsx:renderType')) {
    s = s.replace(/export const ExpandedWidgetPanel[^=]*= \(\{ type, onClose, config, initialData, instanceKey \}\) => \{\n/, (m) => m + "  __agentLog('H7','ExpandedWidgetPanel.tsx:renderType','render expanded widget',{type});\n");
  }

  // Ensure getTitle includes academy/kindle (already added earlier, but safe)
  if (!s.includes("case 'academy'")) {
    s = s.replace(/case 'plan': return 'Service Plan';/, "case 'plan': return 'Service Plan';\n      case 'academy': return 'Ai Academy';\n      case 'kindle': return 'Kindle PDF';");
  }

  // Ensure content render blocks exist
  if (!s.includes("type === 'academy'")) {
    s = s.replace(
      /\{type === 'plan' && \([\s\S]*?\)\}\n\s*\}/m,
      (block) => block.replace(/\}\n\s*\}\n\s*\}/m, "}\n\n          {type === 'academy' && (\n             <AiAcademyWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n             />\n          )}\n\n          {type === 'kindle' && (\n             <KindleWidget\n               onClose={onClose}\n               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}\n               isFullScreen={isFullScreen}\n             />\n          )}\n        }")
    );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched ExpandedWidgetPanel academy/kindle rendering');
}

function patchMessageBubbleButtons() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\MessageBubble.tsx';
  let s = fs.readFileSync(p,'utf8');
  s = ensureLogHelperAfterImports(s);

  // Add simple buttons like PlanWidget button
  if (!s.includes("onExpandWidget && onExpandWidget('academy')")) {
    s = s.replace(
      /\{hasPlanWidget && !isUser && \([\s\S]*?\)\}\n\s*\}/m,
      (block) => block.replace(/\}\n\s*\}\n\s*\}/m, "}\n\n             {hasAcademyWidget && !isUser && (\n                <div className=\"w-full mt-2\">\n                  <button\n                    onClick={() => { __agentLog('H7','MessageBubble.tsx:expand','expand academy',{source:'message'}); onExpandWidget && onExpandWidget('academy'); }}\n                    className=\"w-full bg-gradient-to-r from-[#5972d0] to-[#141D84] text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex items-center justify-between\"\n                  >\n                    <div className=\"flex items-center gap-3\">\n                      <div className=\"bg-white/20 p-2 rounded-lg\">ðŸ“š</div>\n                      <div className=\"text-left\">\n                        <div className=\"font-semibold\">Ai Academy</div>\n                        <div className=\"text-xs text-white/70\">Click to open the Academy</div>\n                      </div>\n                    </div>\n                    <span className=\"text-white/70\">â€º</span>\n                  </button>\n                </div>\n             )}\n\n             {hasKindleWidget && !isUser && (\n                <div className=\"w-full mt-2\">\n                  <button\n                    onClick={() => { __agentLog('H7','MessageBubble.tsx:expand','expand kindle',{source:'message'}); onExpandWidget && onExpandWidget('kindle'); }}\n                    className=\"w-full bg-gradient-to-r from-[#5972d0] to-[#141D84] text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex items-center justify-between\"\n                  >\n                    <div className=\"flex items-center gap-3\">\n                      <div className=\"bg-white/20 p-2 rounded-lg\">ðŸ“„</div>\n                      <div className=\"text-left\">\n                        <div className=\"font-semibold\">Kindle PDF</div>\n                        <div className=\"text-xs text-white/70\">Click to open the PDF viewer</div>\n                      </div>\n                    </div>\n                    <span className=\"text-white/70\">â€º</span>\n                  </button>\n                </div>\n             )}\n        }")
    );
  }

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched MessageBubble academy/kindle buttons');
}

function patchHandleSimulateToolDirectOpen() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\App.tsx';
  let s = fs.readFileSync(p,'utf8');
  s = ensureLogHelperAfterImports(s);

  // Log the tool name when selected
  if (!s.includes('App.tsx:simulateTool')) {
    s = s.replace(/const handleSimulateTool = \(toolName: string\) => \{/, "const handleSimulateTool = (toolName: string) => {\n    __agentLog('H7','App.tsx:simulateTool','simulate tool clicked',{toolName});");
  }

  // In academy/kindle branches, open widget immediately
  s = s.replace(
    /else if \(toolName\.includes\('Academy'\)\) \{\n\s*responseText = `Opening Ai Academy\. \[\[WIDGET:Academy\]\]`;\n\s*\} else if \(toolName\.includes\('Kindle'\)\) \{\n\s*responseText = `Opening Kindle PDF\. \[\[WIDGET:Kindle\]\]`;\n\s*\}/,
    "else if (toolName.includes('Academy')) {\n      responseText = `Opening Ai Academy. [[WIDGET:Academy]]`;\n      __agentLog('H7','App.tsx:openWidget','open academy from menu',{});\n      setExpandedWidget('academy');\n      setExpandedWidgetData(null);\n      setExpandedInstance(prev => prev + 1);\n    } else if (toolName.includes('Kindle')) {\n      responseText = `Opening Kindle PDF. [[WIDGET:Kindle]]`;\n      __agentLog('H7','App.tsx:openWidget','open kindle from menu',{});\n      setExpandedWidget('kindle');\n      setExpandedWidgetData(null);\n      setExpandedInstance(prev => prev + 1);\n    }"
  );

  fs.writeFileSync(p,s,'utf8');
  console.log('Patched handleSimulateTool to open academy/kindle directly');
}

patchExpandedWidgetPanel();
patchMessageBubbleButtons();
patchHandleSimulateToolDirectOpen();
