"use client";

import { AuthProvider } from "../src/context/AuthContext";
import { EnumCatalogProvider } from "../src/context/EnumCatalogContext";
import PrimaryApp from "../src/App";

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: unknown) => {
  try {
    fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fafee3'},body:JSON.stringify({sessionId:'fafee3',runId:'run1',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
__agentLog('H3','frontend/components/PrimaryAppClient.tsx:12','module_eval_start',{});
// #endregion

export default function PrimaryAppClient() {
  // #region agent log
  __agentLog('H4','frontend/components/PrimaryAppClient.tsx:17','component_render',{
    hasWindow: typeof window !== 'undefined',
  });
  // #endregion
  return (
    <EnumCatalogProvider>
      <AuthProvider defaultTier="free">
        <PrimaryApp />
      </AuthProvider>
    </EnumCatalogProvider>
  );
}
