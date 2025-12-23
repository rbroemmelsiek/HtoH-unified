import React, { useEffect } from 'react';

import { Provider } from 'react-redux';
import { store } from '../../store/planApp/store';
import { init } from '../../store/planApp/planAppSlice';
import { useAppDispatch, useAppSelector } from '../../store/planApp/hooks';
import { selectMode } from '../../store/planApp/planAppSelectors';
import TopRow from './TopRow';
import ProgressNav from './nav/ProgressNav';
import DisplayTitle from './DisplayTitle';
import DisplayError from './DisplayError';
import SearchBar from './SearchBar';
import NewPanelAdd from './NewPanelAdd';
import GlobalModal from './GlobalModal';
import InitManager from './InitManager';
import FakeProgressNav from './FakeProgressNav';
import FakeTitle from './FakeTitle';
import FakePanels from './FakePanels';


// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

interface PlanAppProps {
  planId?: string;
  ownerId?: string | number;
  mode?: string;
  sessionType?: string;
  showNav?: boolean;
  keyId?: string;
}

const PlanAppContent: React.FC<PlanAppProps> = ({
  planId = 'plan',
  ownerId = '0',
  mode = 'widget',
  sessionType = 'AGENT',
  showNav = true,
  keyId = '',
}) => {
  const dispatch = useAppDispatch();
  __agentLog('H1','PlanAppContent.tsx:variant','plan app variant',{planAppVariant:'legacy_migrated_plan-app_folder'});
  const currentMode = useAppSelector(selectMode);

  useEffect(() => {
    // Initialize the app with options
    dispatch(
      init({
        planId,
        ownerId,
        mode,
        sessionType,
        showNav,
        keyId,
      })
    );
  }, [dispatch, planId, ownerId, mode, sessionType, showNav, keyId]);

  return (
    <div
      id="plan-app"
      className={`plan-app widget-mode display--flex display--column ${currentMode}`}
    >
      <FakeProgressNav />
      <FakeTitle />
      <FakePanels />
      <ProgressNav />
      <DisplayTitle />
      <DisplayError />
      <div className="plan-actions-placeholder" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <div>
          <SearchBar />
        </div>
        <div>
          <NewPanelAdd />
        </div>
      </div>
      <TopRow />
      <GlobalModal />
      <InitManager />
    </div>
  );
};

const PlanApp: React.FC<PlanAppProps> = (props) => {
  return (
    <Provider store={store}>
      <PlanAppContent {...props} />
    </Provider>
  );
};

export default PlanApp;
