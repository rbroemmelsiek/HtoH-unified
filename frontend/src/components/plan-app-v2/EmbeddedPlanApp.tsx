import React from 'react';
import App from './App';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

export interface EmbeddedPlanAppProps {
  planId?: string;
  ownerId?: string | number;
  showNav?: boolean;
}

export default function EmbeddedPlanApp(props: EmbeddedPlanAppProps) {
  __agentLog('H4','EmbeddedPlanApp.tsx:render','render new AI Studio plan app',{planAppVariant:'ai_studio_react_plan_app_v2',...props});
  // App already includes PlanProvider.
  return <App />;
}
