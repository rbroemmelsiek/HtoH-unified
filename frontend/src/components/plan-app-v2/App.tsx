import React from 'react';
import { PlanProvider } from './context/PlanContext';
import PlanApp from './components/PlanApp';

interface PlanAppRootProps {
  planId?: string;
  ownerId?: string;
}

const App: React.FC<PlanAppRootProps> = ({ planId, ownerId }) => {
  return (
    <PlanProvider planId={planId} ownerId={ownerId}>
      <PlanApp />
    </PlanProvider>
  );
};

export default App;