import dynamic from "next/dynamic";

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: unknown) => {
  try {
    fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fafee3'},body:JSON.stringify({sessionId:'fafee3',runId:'run1',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
__agentLog('H1','frontend/app/page.tsx:9','module_eval_start',{
  pid: typeof process !== 'undefined' ? process.pid : null,
  nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : null,
});
// #endregion

const PrimaryAppClient = dynamic(
  () => import("../components/PrimaryAppClient"),
  {ssr: false}
);

export default function Home() {
  // #region agent log
  __agentLog('H2','frontend/app/page.tsx:20','home_render_invoked',{
    hasWindow: typeof window !== 'undefined',
  });
  // #endregion
  return <PrimaryAppClient />;
}
