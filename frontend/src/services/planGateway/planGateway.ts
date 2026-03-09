// React-compatible PlanGateway adapter
// This adapts the Vue planGateway to work with React/Redux (and future Firebase).

import { PlanGatewayResponse, PlanGatewayPostResponse, PlanUpdateCallback, Unsubscribe } from './types';

// Import Firebase services directly (they're not Vue-specific)
// We'll need to copy/adapt the Firebase gateway implementation
let gateway: any = null;

function hasFirebaseWebConfig(): boolean {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  return Boolean(
    env?.NEXT_PUBLIC_FIREBASE_API_KEY &&
      env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      env?.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

// Lazy load the gateway based on environment
async function getGateway() {
  if (gateway) return gateway;

  const dataSource = (
    (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_PLAN_DATASOURCE : undefined) ??
    "local"
  ).toLowerCase();

  if (dataSource === 'firebase') {
    if (hasFirebaseWebConfig()) {
      const { default: FirebasePlanGateway } = await import('./firebasePlanGateway');
      gateway = new FirebasePlanGateway();
    } else {
      console.warn(
        '[planGateway] NEXT_PUBLIC_PLAN_DATASOURCE=firebase but Firebase Web env vars are missing. Falling back to LocalPlanGateway.'
      );
      const { default: LocalPlanGateway } = await import('./localPlanGateway');
      gateway = new LocalPlanGateway();
    }
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

  // Persist the latest plan document through the active gateway.
  // Local gateway uses localStorage; future Firebase gateway can override updatePlan.
  async updatePlan(plan: PlanGatewayResponse): Promise<void> {
    const gw: any = await getGateway();

    if (typeof gw.updatePlan === 'function') {
      gw.updatePlan(plan);
      return;
    }

    if (typeof gw.post === 'function') {
      try {
        await gw.post('updatePlan', { plan });
      } catch (e) {
        console.error('[planGateway] updatePlan fallback failed', e);
      }
    }
  }
}

export const planGateway = new PlanGatewayService();
export default planGateway;
