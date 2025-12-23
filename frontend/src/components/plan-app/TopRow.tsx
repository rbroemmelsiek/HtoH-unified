import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/planApp/hooks';
import {
  selectIsAppReady,
  selectRoot,
  selectTopRowRecalc,
} from '../../store/planApp/planAppSelectors';
import { rowMove } from '../../store/planApp/planAppThunks';
import EntryComponent from './EntryComponent';
import { ReactSortable } from 'react-sortablejs';
import getOffset from '../../utils/getOffset';
import { PlanRow } from '../../types/planApp/planRow';

const TopRow: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAppReady = useAppSelector(selectIsAppReady);
  const root = useAppSelector(selectRoot);
  const topRowRecalc = useAppSelector(selectTopRowRecalc);
  const topRowRef = useRef<HTMLUListElement>(null);
  const [topRowMinHeight, setTopRowMinHeight] = useState('0');
  const [items, setItems] = useState<PlanRow[]>([]);

  useEffect(() => {
    setItems([...root.children]);
  }, [root.children]);

  useEffect(() => {
    if (topRowRecalc === null) {
      setTopRowMinHeight('0');
      return;
    }

    if (!topRowRef.current) return;

    const popoverBottom = topRowRecalc.top + topRowRecalc.offsetHeight;
    const topRow = getOffset(topRowRef.current);
    const topRowBottom = topRow.top + topRow.offsetHeight;
    const lack = popoverBottom - topRowBottom;
    const newMinHeight = topRow.offsetHeight + lack + 20;

    setTopRowMinHeight(`${newMinHeight}px`);
  }, [topRowRecalc]);

  const handleDragUpdate = (newItems: PlanRow[]) => {
    setItems(newItems);
    
    // Find which item moved by comparing positions
    if (newItems.length !== root.children.length) return;
    
    for (let i = 0; i < newItems.length; i++) {
      const newItem = newItems[i];
      const oldItem = root.children.find((c) => c.eid === newItem.eid);
      if (oldItem && oldItem.pos !== i) {
        // Item moved to position i
        dispatch(
          rowMove({
            el: newItem,
            update: [['newPos', i]],
          })
        );
        break;
      }
    }
  };

  if (!isAppReady) {
    return null;
  }

  return (
    <ul
      className="topRow"
      ref={topRowRef}
      style={{ minHeight: topRowMinHeight, margin: 0, padding: 0, listStyle: 'none' }}
    >
      <ReactSortable
        list={items}
        setList={handleDragUpdate}
        group="panels"
        handle=".sort-handler"
        animation={200}
      >
        {items.map((child) => (
          <EntryComponent key={child.eid} branch={child} />
        ))}
      </ReactSortable>
    </ul>
  );
};

export default TopRow;
