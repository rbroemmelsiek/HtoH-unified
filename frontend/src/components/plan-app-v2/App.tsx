import React from 'react';
import { PlanProvider } from './context/PlanContext';
import PlanApp from './components/PlanApp';

const App: React.FC = () => {
  return (
    <PlanProvider>
      <PlanApp />
    </PlanProvider>
  );
};

export default App;