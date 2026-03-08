import React from 'react';
import { PlanRow } from '../../types/planApp/planRow';
import PanelRow from './rows/PanelRow';
import TextRow from './rows/TextRow';
import CheckboxRow from './rows/CheckboxRow';
import CommentRow from './rows/CommentRow';
import LinkRow from './rows/LinkRow';
import { useAppSelector } from '../../store/planApp/hooks';
import { selectIsSearchEnabled, selectAmbassadorMode } from '../../store/planApp/planAppSelectors';

interface EntryComponentProps {
  branch: PlanRow;
}

const EntryComponent: React.FC<EntryComponentProps> = ({ branch }) => {
  const isSearchEnabled = useAppSelector(selectIsSearchEnabled);
  const ambassadorMode = useAppSelector(selectAmbassadorMode);

  // Always draw subtree, but hide content via CSS when not visible
  const drawSubtree = true;
  const opened = branch.type === 'root' || branch.opened;
  const branchInFilter = isSearchEnabled && branch.filterMatch;

  if (!drawSubtree) {
    return null;
  }

  if (isSearchEnabled && !branchInFilter) {
    return null;
  }

  const componentMap: Record<string, React.ComponentType<{ element: PlanRow }>> = {
    elPanel: PanelRow,
    elText: TextRow,
    elCheckbox: CheckboxRow,
    elComment: CommentRow,
    elLink: LinkRow,
  };

  const componentType =
    'el' + branch.type.charAt(0).toUpperCase() + branch.type.slice(1);
  const Component = componentMap[componentType];

  if (!Component) {
    console.warn(`Unknown component type: ${componentType}`);
    return null;
  }

  return (
    <li className={branch.visible ? '' : 'hidden-plan-part'}>
      <Component element={branch} />
      {opened && branch.children.length > 0 && (
        <ul className="sort" data-eid={branch.eid} data-pid={branch.pid}>
          {branch.children.map((child) => (
            <EntryComponent key={child.eid} branch={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default EntryComponent;
