import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/planApp/hooks';
import { getPlan } from '../../store/planApp/planAppThunks';


// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

const InitManager: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize plan loading
    dispatch(getPlan());
    __agentLog('H2','InitManager.tsx:getPlan','dispatch(getPlan)',{planAppVariant:'legacy_migrated_plan-app_folder'});
  }, [dispatch]);

  return null;
};

export default InitManager;
