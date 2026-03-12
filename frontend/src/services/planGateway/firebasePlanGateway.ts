import type {
  PlanGateway,
  PlanGatewayPostResponse,
  PlanGatewayResponse,
  PlanSummary,
  PlanUpdateCallback,
  Unsubscribe,
} from './types';
import { firebaseFirestore } from '../../lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const PLAN_COLLECTION =
  process.env.NEXT_PUBLIC_PLAN_COLLECTION || 'plans';

const DEFAULT_PLAN_ID = process.env.NEXT_PUBLIC_PLAN_ID || 'plan_0';

function getPlanId(params: Record<string, unknown>): string {
  const fromParams = typeof params.planId === 'string' ? params.planId : undefined;
  return fromParams || DEFAULT_PLAN_ID;
}

function getOwnerId(params: Record<string, unknown>): string | undefined {
  return typeof params.uid === 'string' ? params.uid : undefined;
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
  async createPlan(ownerId: string, name = 'My Service Plan'): Promise<string> {
    const db = requireFirestore();
    const ref = await addDoc(collection(db, PLAN_COLLECTION), {
      ownerId,
      name,
      root: { children: [] },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async listPlans(ownerId: string): Promise<PlanSummary[]> {
    const db = requireFirestore();
    const q = query(collection(db, PLAN_COLLECTION), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name || 'My Service Plan',
      };
    });
  }

  async fetch(
    action: string,
    params: Record<string, unknown>
  ): Promise<PlanGatewayResponse> {
    const db = requireFirestore();
    const explicitPlanId = typeof params.planId === 'string' ? params.planId : undefined;
    const ownerId = getOwnerId(params);

    if (explicitPlanId) {
      const ref = doc(db, PLAN_COLLECTION, explicitPlanId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as any;
        if (ownerId && !data.ownerId) {
          // One-time legacy migration: claim owner on old singleton plans.
          await setDoc(ref, { ownerId, updatedAt: serverTimestamp() }, { merge: true });
        }
        return {
          planId: snap.id,
          name: data.name || 'Service Plan',
          root: {
            children: Array.isArray(data.root?.children) ? data.root.children : [],
          },
        };
      }
    }

    if (ownerId) {
      const q = query(
        collection(db, PLAN_COLLECTION),
        where('ownerId', '==', ownerId),
        limit(1)
      );
      const ownerPlans = await getDocs(q);
      const firstDoc = ownerPlans.docs[0];
      if (firstDoc) {
        const data = firstDoc.data() as any;
        return {
          planId: firstDoc.id,
          name: data.name || 'Service Plan',
          root: {
            children: Array.isArray(data.root?.children) ? data.root.children : [],
          },
        };
      }
      const newPlanId = await this.createPlan(ownerId, 'My Service Plan');
      return {
        planId: newPlanId,
        name: 'My Service Plan',
        root: { children: [] },
      };
    }

    const planId = getPlanId(params);
    const ref = doc(db, PLAN_COLLECTION, planId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        planId: snap.id,
        name: data.name || 'Service Plan',
        root: {
          children: Array.isArray(data.root?.children) ? data.root.children : [],
        },
      };
    }

    // Fallback for non-user-scoped mode.
    const emptyPlan: PlanGatewayResponse = {
      planId,
      name: 'My Service Plan',
      root: { children: [] },
    };

    await setDoc(ref, {
      ...emptyPlan,
      ownerId: ownerId ?? null,
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
        planId: snap.id,
        name: data.name || 'Service Plan',
        root: {
          children: Array.isArray(data.root?.children) ? data.root.children : [],
        },
      });
    });

    return unsubscribe;
  }

  // Called by planGateway.updatePlan
  updatePlan(plan: PlanGatewayResponse, planId?: string, ownerId?: string) {
    const db = requireFirestore();
    const resolvedPlanId = planId || plan.planId || DEFAULT_PLAN_ID;
    const ref = doc(db, PLAN_COLLECTION, resolvedPlanId);
    void setDoc(
      ref,
      {
        ...plan,
        ownerId: ownerId ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

