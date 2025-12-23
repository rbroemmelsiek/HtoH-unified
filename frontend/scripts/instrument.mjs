import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

function injectPlanWidget() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\PlanWidget.tsx';
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('// #region agent log')) {
    console.log('PlanWidget already instrumented');
    return;
  }

  const logHelper = `
// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion
`;

  s = s.replace("import PlanApp from './plan-app/PlanApp';", "import PlanApp from './plan-app/PlanApp';" + logHelper);
  s = s.replace('  return (', "  __agentLog('H1','PlanWidget.tsx:render','PlanWidget render',{planId,ownerId,showNav,isExpanded,isFullScreen,loadKey});\n\n  return (");
  fs.writeFileSync(p, s, 'utf8');
  console.log('Instrumented PlanWidget');
}

function injectPlanApp() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app\\PlanApp.tsx';
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('// #region agent log')) {
    console.log('PlanApp already instrumented');
    return;
  }

  const logHelper = `
// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion
`;

  // Insert helper after first React import
  s = s.replace(/import\s+React[^\n]*\n/, (m) => m + logHelper);

  // Log on component entry (support function or const)
  s = s.replace(/(function\s+PlanApp\([^\)]*\)\s*\{)/, "$1\n  __agentLog('H1','PlanApp.tsx:enter','PlanApp mounted',{});");
  s = s.replace(/(export\s+const\s+PlanApp[^=]*=\s*\([^\)]*\)\s*=>\s*\{)/, "$1\n  __agentLog('H1','PlanApp.tsx:enter','PlanApp mounted',{});");

  fs.writeFileSync(p, s, 'utf8');
  console.log('Instrumented PlanApp');
}

injectPlanWidget();
injectPlanApp();
