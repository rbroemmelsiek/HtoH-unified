import { PlanRow } from '../types/planApp/planRow';
import { store } from '../store/planApp/store';

export default function getDummyElement(
  type: 'panel' | 'text' | 'checkbox' | 'link' | 'comment' | 'root',
  pid?: string
): PlanRow {
  const now = Math.floor(Date.now() / 1000).toString();
  const eid = type + '-' + Math.floor(Math.random() * 26) + now;
  const state = store.getState().planApp;
  
  return {
    edit: true,
    owner: state.owner,
    eid: eid,
    pid: pid || 'root',
    pos: 0,
    name: '',
    tooltip: '',
    type: type,
    checked: 0,
    visible: true,
    new_window: true,
    link: '',
    date: type === 'comment' ? now : null,
    children: [],
    video: '',
    video_script: '',
  };
}
