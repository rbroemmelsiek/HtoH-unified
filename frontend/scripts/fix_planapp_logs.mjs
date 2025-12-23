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
  s = s.replace(/\n\/\/ #region agent log[\s\S]*?\/\/ #endregion\n/g, '\n');

  const importMatches = [...s.matchAll(/^import[^;]*;\s*$/gm)];
  if (importMatches.length === 0) return s; // leave unchanged

  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  s = s.slice(0, insertAt) + helper + s.slice(insertAt);
  return s;
}

function patchPlanApp() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app\\PlanApp.tsx';
  let s = upsertHelperAfterImports(p);

  // Ensure a visible version log is emitted when PlanAppContent renders
  if (!s.includes("planAppVariant")) {
    s = s.replace(/const dispatch = useAppDispatch\(\);/, "const dispatch = useAppDispatch();\n  __agentLog('H1','PlanAppContent.tsx:variant','plan app variant',{planAppVariant:'legacy_migrated_plan-app_folder'});");
  }

  // Ensure init dispatch log
  if (!s.includes("dispatch(init)")) {
    // keep existing code
  }
  if (!s.includes("PlanAppContent.tsx:init")) {
    s = s.replace(/dispatch\(\n\s*init\(\{/, (m) => {
      return "    __agentLog('H2','PlanAppContent.tsx:init','dispatch(init)',{planAppVariant:'legacy_migrated_plan-app_folder',planId,ownerId,mode,sessionType,showNav,hasKeyId: !!keyId});\n\n      " + m;
    });
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('Updated PlanApp.tsx');
}

function patchInitManager() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app\\InitManager.tsx';
  let s = upsertHelperAfterImports(p);
  if (!s.includes('InitManager.tsx:getPlan')) {
    s = s.replace(/dispatch\(getPlan\(\)\);/, "dispatch(getPlan());\n    __agentLog('H2','InitManager.tsx:getPlan','dispatch(getPlan)',{planAppVariant:'legacy_migrated_plan-app_folder'});");
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log('Updated InitManager.tsx');
}

patchPlanApp();
patchInitManager();
