import { PlanDocument } from './types';

export const SAMPLE_PLAN: PlanDocument = {
  name: 'My Service Plan',
  root: {
    children: [
      {
        eid: 'panel-1',
        pid: 'root',
        pos: 0,
        type: 'panel',
        name: 'Morning Session',
        tooltip: 'Main morning block',
        link: '',
        date: null,
        new_window: true,
        visible: true,
        opened: true,
        edit: false,
        checked: 0,
        video: '',
        video_script: '',
        owner: 0,
        children: [
          {
            eid: 'checkbox-1',
            pid: 'panel-1',
            pos: 0,
            type: 'checkbox',
            name: 'Safety Check',
            tooltip: 'Ensure all cables are secured and power is stable',
            link: '',
            date: null,
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 0,
            video: '',
            video_script: '',
            owner: 0,
            children: []
          },
          {
            eid: 'text-1',
            pid: 'panel-1',
            pos: 1,
            type: 'text',
            name: 'Welcome Video (Landscape)',
            tooltip: 'Watch in full width',
            link: '',
            date: null,
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 0,
            video: 'https://www.youtube.com/embed/Isq-bVj_yHE?si=C2Qr4P1TgK2_bhfh', 
            video_script: '',
            owner: 0,
            children: []
          },
          {
            eid: 'text-2',
            pid: 'panel-1',
            pos: 2,
            type: 'text',
            name: 'Quick Update (Portrait)',
            tooltip: 'Watch in vertical mode',
            link: '',
            date: null,
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 0,
            video: 'https://youtube.com/shorts/u1fT3dbFxvE?si=jwgK9BuA4i_DSaQK',
            video_script: '',
            owner: 0,
            children: []
          },
          {
            eid: 'link-1',
            pid: 'panel-1',
            pos: 3,
            type: 'link',
            name: 'Reference Doc',
            tooltip: 'Opens in new tab',
            link: 'https://example.com',
            date: null,
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 1, // unread/attention
            video: '',
            video_script: '',
            owner: 0,
            children: []
          },
          {
            eid: 'checkbox-done',
            pid: 'panel-1',
            pos: 4,
            type: 'checkbox',
            name: 'Previous Log Entry',
            tooltip: '',
            link: '',
            date: '1735722000', // Approx Jan 1 2025
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 4, // DONE
            video: '',
            video_script: '',
            owner: 0,
            children: []
          },
          {
            eid: 'comment-1',
            pid: 'panel-1',
            pos: 5,
            type: 'comment',
            name: 'Internal Note: Check mic levels',
            tooltip: '',
            link: '',
            date: null,
            new_window: true,
            visible: true,
            opened: false,
            edit: false,
            checked: 1, // unread
            video: '',
            video_script: '',
            owner: 0,
            children: []
          }
        ]
      }
    ]
  }
};