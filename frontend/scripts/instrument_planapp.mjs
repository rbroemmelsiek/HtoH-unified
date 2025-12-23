import fs from 'fs';

const ENDPOINT = 'http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06';

const logHelper = `
// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('${ENDPOINT}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion
`;

function ensureLogHelperAfterImports(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');

  // Remove any existing helper block (so we can reposition it safely)
  s = s.replace(/\n\/\/ #region agent log[\s\S]*?\/\/ #endregion\n/g, '\n');

  if (!s.includes('__agentLog')) {
    // no helper present, but we want to insert exactly once
  }

  // Insert helper after the last import statement
  const importMatches = [...s.matchAll(/^import[^;]*;\s*$/gm)];
  if (importMatches.length === 0) return s;
  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  s = s.slice(0, insertAt) + logHelper + s.slice(insertAt);
  return s;
}

function patchPlanApp() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app\\PlanApp.tsx';
  let s = ensureLogHelperAfterImports(p);

  // log at start of PlanAppContent render
  if (!s.includes("PlanAppContent.tsx:render")) {
    s = s.replace(/\)\s*=>\s*\{\n\s*const dispatch = useAppDispatch\(\);/, (m) => {
      return m.replace('const dispatch = useAppDispatch();',
        "const dispatch = useAppDispatch();\n  __agentLog('H1','PlanAppContent.tsx:render','PlanAppContent render',{planId,ownerId,mode,sessionType,showNav,hasKeyId: !!keyId});");
    });
  }

  // log when init dispatched
  if (!s.includes("PlanAppContent.tsx:init")) {
    s = s.replace(/useEffect\(\(\) => \{\n\s*\/\/ Initialize the app with options\n\s*dispatch\(/, (m) => {
      return m + "\n    __agentLog('H2','PlanAppContent.tsx:init','dispatch(init)',{planId,ownerId,mode,sessionType,showNav,hasKeyId: !!keyId});\n";
    });
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('Patched PlanApp.tsx');
}

function patchInitManager() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\plan-app\\InitManager.tsx';
  let s = ensureLogHelperAfterImports(p);

  if (!s.includes('InitManager.tsx:getPlan')) {
    s = s.replace(/useEffect\(\(\) => \{\n\s*\/\/ Initialize plan loading\n\s*dispatch\(getPlan\(\)\);/, (m) => {
      return m + "\n    __agentLog('H2','InitManager.tsx:getPlan','dispatch(getPlan)',{});";
    });
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('Patched InitManager.tsx');
}

function patchThunks() {
  const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\store\\planApp\\planAppThunks.ts';
  let s = ensureLogHelperAfterImports(p);

  if (!s.includes('planAppThunks.ts:getPlan:enter')) {
    s = s.replace(/async \(_, \{ dispatch, getState \}\) => \{\n\s*const state = getState\(\)\.planApp;/,
      (m) => m + "\n    __agentLog('H3','planAppThunks.ts:getPlan:enter','getPlan thunk enter',{mode: state.mode, plan: state.plan, owner: state.owner, sessionType: state.sessionType, hasKeyId: !!state.keyId});");
  }

  if (!s.includes('planAppThunks.ts:subscribe')) {
    s = s.replace(/const unsubscribe = await planGateway\.subscribe\(/,
      (m) => "      __agentLog('H3','planAppThunks.ts:subscribe','planGateway.subscribe',{action, plan: state.plan, owner: state.owner});\n" + m);
  }

  if (!s.includes('planAppThunks.ts:onResponse')) {
    s = s.replace(/\(response\) => \{\n\s*console\.log\('\[PlanApp\] Plan data received:', \{/, (m) => {
      return "        (response) => {\n          __agentLog('H3','planAppThunks.ts:onResponse','plan data received',{hasRoot: !!response?.root, childrenCount: response?.root?.children?.length || 0, planName: response?.name});\n          console.log('[PlanApp] Plan data received:', {";
    });
  }

  if (!s.includes('planAppThunks.ts:onError')) {
    s = s.replace(/console\.error\('\[PlanApp\] Failed to subscribe to plan:', error\);/,
      (m) => "      __agentLog('H3','planAppThunks.ts:onError','subscribe failed',{error: String(error)});\n" + m);
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('Patched planAppThunks.ts');
}

patchPlanApp();
patchInitManager();
patchThunks();
