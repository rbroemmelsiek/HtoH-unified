import type {
  PlanGateway,
  PlanGatewayPostResponse,
  PlanGatewayResponse,
  PlanUpdateCallback,
  Unsubscribe,
} from './types';
import { firebaseFirestore } from '../../lib/firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const PLAN_COLLECTION =
  process.env.NEXT_PUBLIC_PLAN_COLLECTION || 'plans';

const DEFAULT_PLAN_ID =
  process.env.NEXT_PUBLIC_PLAN_ID || 'plan_0';

function getPlanId(params: Record<string, unknown>): string {
  const fromParams = typeof params.planId === 'string' ? params.planId : undefined;
  return fromParams || DEFAULT_PLAN_ID;
}

function requireFirestore() {
  if (!firebaseFirestore) {
    throw new Error(
      'Firebase not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseFirestore;
}

export default class FirebasePlanGateway implements PlanGateway {
  async fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse> {
    const db = requireFirestore();
    const planId = getPlanId(params);
    const ref = doc(db, PLAN_COLLECTION, planId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        name: data.name || 'Service Plan',
        root: {
          children: Array.isArray(data.root?.children) ? data.root.children : [],
        },
      };
    }

    // If no document exists yet, seed an empty plan document.
    const emptyPlan: PlanGatewayResponse = {
      name: 'My Service Plan',
      root: { children: [] },
    };

    await setDoc(ref, {
      ...emptyPlan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return emptyPlan;
  }

  async post(
    action: string,
    payload: Record<string, unknown>
  ): Promise<PlanGatewayPostResponse> {
    // Not used by the new React plan app v2; provided for interface compatibility.
    console.log('[FirebasePlanGateway] post (no-op)', action, payload);
    return { result: 1 };
  }

  subscribe(
    action: string,
    params: Record<string, unknown>,
    callback: PlanUpdateCallback
  ): Unsubscribe {
    const db = requireFirestore();
    const planId = getPlanId(params);
    const ref = doc(db, PLAN_COLLECTION, planId);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      callback({
        name: data.name || 'Service Plan',
        root: {
          children: Array.isArray(data.root?.children) ? data.root.children : [],
        },
      });
    });

    return unsubscribe;
  }

  // Called by planGateway.updatePlan
  updatePlan(plan: PlanGatewayResponse) {
    const db = requireFirestore();
    const ref = doc(db, PLAN_COLLECTION, DEFAULT_PLAN_ID);
    void setDoc(
      ref,
      {
        ...plan,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

