import React from 'react';
import { useAppSelector } from '../../../store/planApp/hooks';
import { selectUseNav, selectIsAppReady } from '../../../store/planApp/planAppSelectors';
import { selectNavSteps } from '../../../store/planApp/planAppSelectors';
import NavStep from './NavStep';

const ProgressNav: React.FC = () => {
  const useNav = useAppSelector(selectUseNav);
  const isAppReady = useAppSelector(selectIsAppReady);
  const navSteps = useAppSelector(selectNavSteps);

  // Debug logging
  if (typeof window !== 'undefined' && (window as any).__PLAN_DEBUG) {
    console.log('[ProgressNav] Visibility check:', {
      useNav,
      isAppReady,
      navStepsLength: navSteps.length,
      navSteps: navSteps.map(s => ({ name: s.name, totalCount: s.totalCount, visible: s.visible })),
    });
  }

  if (!useNav || !isAppReady || navSteps.length === 0) {
    return null;
  }

  return (
    <div className="plan-app__progress-nav sticky">
      {navSteps.map((step, index) => (
        <NavStep
          key={step.pid}
          step={step}
          firstStep={index === 0}
          lastStep={index === navSteps.length - 1}
        />
      ))}
    </div>
  );
};

export default ProgressNav;
