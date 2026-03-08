import React from 'react';
import { NavStepType } from '../../../types/planApp/navStep';
import { useAppDispatch } from '../../../store/planApp/hooks';
import { addOpenedByNav, setNavStepHovered } from '../../../store/planApp/planAppSlice';

interface NavStepProps {
  step: NavStepType;
  firstStep: boolean;
  lastStep: boolean;
}

const NavStep: React.FC<NavStepProps> = ({ step, firstStep, lastStep }) => {
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(addOpenedByNav(step.pid));
  };

  const handleMouseEnter = () => {
    dispatch(setNavStepHovered(step.pid));
  };

  const handleMouseLeave = () => {
    dispatch(setNavStepHovered(''));
  };

  const gradientStyle = {
    background: `linear-gradient(to right, 
      rgba(50, 205, 50, ${step.donePercent}) 0%,
      rgba(50, 205, 50, ${step.donePercent}) ${step.donePercent * 100}%,
      rgba(50, 205, 50, ${step.wnPercent}) ${step.donePercent * 100}%,
      rgba(50, 205, 50, ${step.wnPercent}) ${(step.donePercent + step.wnPercent) * 100}%,
      transparent ${(step.donePercent + step.wnPercent) * 100}%,
      transparent 100%)`,
  };

  return (
    <div
      className={`nav-step ${step.navOpened ? 'nav-opened' : ''} ${step.hovered ? 'hovered' : ''} ${firstStep ? 'first-step' : ''} ${lastStep ? 'last-step' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={gradientStyle}
    >
      <span className="nav-step__name">{step.name}</span>
      {step.totalCount > 0 && (
        <span className="nav-step__count">
          {step.doneCount}/{step.totalCount}
        </span>
      )}
    </div>
  );
};

export default NavStep;
