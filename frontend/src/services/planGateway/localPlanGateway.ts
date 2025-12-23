import { PlanGateway, PlanGatewayPostResponse, PlanGatewayResponse, PlanUpdateCallback, Unsubscribe } from './types';
import { PlanRow } from '../../types/planApp/planRow';

// Local storage key for plan data
const PLAN_STORAGE_KEY = 'plan-app-local-data';

// Get plan from localStorage or return empty plan
function getLocalPlan(): PlanGatewayResponse {
  try {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (parsed && parsed.root && Array.isArray(parsed.root.children)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[LocalPlanGateway] Failed to load from localStorage:', e);
  }
  
  // Return sample plan with test data
  const now = Math.floor(Date.now() / 1000).toString();
  return {
    name: 'My Service Plan',
    root: {
      children: [
        {
          eid: 'panel-1',
          pid: 'root',
          pos: 0,
          type: 'panel',
          name: 'Sample Panel',
          edit: false,
          opened: true,
          visible: true,
          checked: 0,
          tooltip: '',
          link: '',
          date: null,
          new_window: true,
          video: '',
          video_script: '',
          owner: 0,
          children: [
            {
              eid: 'checkbox-1',
              pid: 'panel-1',
              pos: 0,
              type: 'checkbox',
              name: 'Sample Task',
              edit: false,
              opened: false,
              visible: true,
              checked: 0,
              tooltip: '',
              link: '',
              date: null,
              new_window: true,
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
              name: 'Sample Text Item',
              edit: false,
              opened: false,
              visible: true,
              checked: 0,
              tooltip: '',
              link: '',
              date: null,
              new_window: true,
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
}

// Save plan to localStorage
function saveLocalPlan(plan: PlanGatewayResponse) {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch (e) {
    console.error('[LocalPlanGateway] Failed to save to localStorage:', e);
  }
}

export default class LocalPlanGateway implements PlanGateway {
  private currentPlan: PlanGatewayResponse;
  private callbacks: Set<PlanUpdateCallback> = new Set();

  constructor() {
    this.currentPlan = getLocalPlan();
    console.log('[LocalPlanGateway] Initialized with plan:', {
      name: this.currentPlan.name,
      childrenCount: this.currentPlan.root.children.length
    });
  }

  async fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse> {
    console.log('[LocalPlanGateway] Fetch:', action, params);
    return { ...this.currentPlan };
  }

  async post(
    action: string,
    payload: Record<string, unknown>
  ): Promise<PlanGatewayPostResponse> {
    console.log('[LocalPlanGateway] Post:', action, payload);
    
    // For now, just return success
    // In a real implementation, we'd update the plan structure here
    // But since we're using Redux for state management, the updates
    // are handled in the thunks and we just need to persist
    
    // Reload plan to get latest state (in real app, this would come from server)
    this.currentPlan = getLocalPlan();
    saveLocalPlan(this.currentPlan);
    
    return { result: 1 };
  }

  subscribe(
    action: string,
    params: Record<string, unknown>,
    callback: PlanUpdateCallback
  ): Unsubscribe {
    console.log('[LocalPlanGateway] Subscribe:', action, params);
    
    // Add callback
    this.callbacks.add(callback);
    
    // Immediately call with current plan
    setTimeout(() => {
      callback({ ...this.currentPlan });
    }, 0);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Method to update plan (called after Redux updates)
  updatePlan(plan: PlanGatewayResponse) {
    this.currentPlan = plan;
    saveLocalPlan(plan);
    
    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback({ ...plan });
      } catch (e) {
        console.error('[LocalPlanGateway] Error in callback:', e);
      }
    });
  }
}
