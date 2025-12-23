// React-compatible PlanGateway adapter
// This adapts the Vue planGateway to work with React/Redux

import { PlanGatewayResponse, PlanGatewayPostResponse, PlanUpdateCallback, Unsubscribe } from './types';

// Import Firebase services directly (they're not Vue-specific)
// We'll need to copy/adapt the Firebase gateway implementation
let gateway: any = null;

// Lazy load the gateway based on environment
async function getGateway() {
  if (gateway) return gateway;

  const dataSource = (import.meta.env.VITE_PLAN_DATASOURCE || 'local').toLowerCase();

  if (dataSource === 'firebase') {
    // TODO: Import and use FirebasePlanGateway
    // For now, using local as fallback
    const { default: LocalPlanGateway } = await import('./localPlanGateway');
    gateway = new LocalPlanGateway();
  } else if (dataSource === 'local') {
    // Use local storage for testing
    const { default: LocalPlanGateway } = await import('./localPlanGateway');
    gateway = new LocalPlanGateway();
  } else {
    // Legacy WordPress AJAX (requires window.planAjaxObj)
    const { default: LegacyPlanGateway } = await import('./legacyPlanGateway');
    gateway = new LegacyPlanGateway();
  }

  return gateway;
}

class PlanGatewayService {
  async fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse> {
    const gw = await getGateway();
    return gw.fetch(action, params);
  }

  async post(
    action: string,
    payload: Record<string, unknown>
  ): Promise<PlanGatewayPostResponse> {
    const gw = await getGateway();
    return gw.post(action, payload);
  }

  async subscribe(
    action: string,
    params: Record<string, unknown>,
    callback: PlanUpdateCallback
  ): Promise<Unsubscribe> {
    const gw = await getGateway();
    return gw.subscribe(action, params, callback);
  }
}

export const planGateway = new PlanGatewayService();
export default planGateway;
