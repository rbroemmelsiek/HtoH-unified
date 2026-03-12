import React, { useEffect, useState } from 'react';
import planGateway from '../../../services/planGateway/planGateway';
import { useAuth } from '../../../context/AuthContext';
import { getContactDirectory } from '../../../services/contactDirectory';
import { usePlan } from '../context/PlanContext';

interface PlanOption {
  id: string;
  name: string;
}

const PlanSwitcher: React.FC = () => {
  const { user, userProfile, setCurrentPlanId, loading: authLoading } = useAuth();
  const { state: planState, dispatch: planDispatch } = usePlan();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const isBusy = authLoading || loading || creating || renaming;

  const getDefaultPlanName = () => {
    const contacts = getContactDirectory();
    const primary =
      contacts.find((c) => c.category === 'party' && c.isFavorite) ||
      contacts.find((c) => c.category === 'party') ||
      contacts[0];

    if (primary?.name) {
      return primary.name.includes('Service Plan')
        ? primary.name
        : `${primary.name} Service Plan`;
    }

    return 'My Service Plan';
  };

  const loadPlans = async (): Promise<PlanOption[]> => {
    if (!user?.uid) {
      setPlans([]);
      return [];
    }
    setLoading(true);
    try {
      const nextPlans = await planGateway.listPlans(user.uid);
      const selectedName = userProfile?.currentPlanId
        ? (nextPlans.find((p) => p.id === userProfile.currentPlanId)?.name ?? null)
        : null;

      if (nextPlans.length === 0 && userProfile?.currentPlanId) {
        // Recover when profile points to a plan that is no longer listable by owner query.
        try {
          const fetched = await planGateway.fetch('load', {
            planId: userProfile.currentPlanId,
            uid: user.uid,
          });
          setPlans([{ id: fetched.planId || userProfile.currentPlanId, name: fetched.name || 'My Service Plan' }]);
        } catch (error) {
          setPlans([]);
          return [];
        }
      } else {
        setPlans(nextPlans);
      }
      return nextPlans;
    } catch (error) {
      console.error('[PlanSwitcher] Failed to list plans', error);
      setPlans([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, [user?.uid, userProfile?.currentPlanId]);

  const handleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!user?.uid) return;
    const selectedPlanId = event.target.value;
    try {
      await setCurrentPlanId(selectedPlanId);
    } catch (error) {
      console.error('[PlanSwitcher] Failed to switch plan', error);
    }
  };

  const handleCreate = async () => {
    if (!user?.uid) return;
    setCreating(true);
    try {
      const newPlanId = await planGateway.createPlan(user.uid, getDefaultPlanName());
      await setCurrentPlanId(newPlanId);
      await loadPlans();
    } catch (error) {
      console.error('[PlanSwitcher] Failed to create plan', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!user?.uid || !userProfile?.currentPlanId) return;
    const currentPlanId = userProfile.currentPlanId;
    const current = plans.find((p) => p.id === currentPlanId);
    const nextName = window.prompt('Rename plan', current?.name || 'My Service Plan');
    if (!nextName) return;
    const trimmedName = nextName.trim();
    if (!trimmedName) return;
    const previousPlanName = planState.plan.name;

    setRenaming(true);
    try {
      // Optimistically reflect rename everywhere in the visible UI.
      setPlans((prev) => prev.map((p) => (p.id === currentPlanId ? { ...p, name: trimmedName } : p)));
      planDispatch({ type: 'SET_PLAN_NAME', payload: trimmedName });

      await planGateway.renamePlan(user.uid, currentPlanId, trimmedName);
      await loadPlans();
    } catch (error) {
      console.error('[PlanSwitcher] Failed to rename plan', error);
      // Revert optimistic state when persistence fails.
      setPlans((prev) =>
        prev.map((p) => (p.id === currentPlanId ? { ...p, name: current?.name || previousPlanName } : p))
      );
      planDispatch({ type: 'SET_PLAN_NAME', payload: previousPlanName });
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <select
        value={userProfile?.currentPlanId ?? ''}
        onChange={handleSelect}
        className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
        disabled={!user?.uid || isBusy || plans.length === 0}
      >
        {plans.length === 0 ? (
          <option value="">
            {!user?.uid ? 'Sign in to load plans' : authLoading ? 'Verifying account...' : loading ? 'Loading plans...' : 'No plans available'}
          </option>
        ) : (
          plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))
        )}
      </select>
      <button
        type="button"
        onClick={handleCreate}
        disabled={!user?.uid || isBusy}
        className="rounded bg-[#141D84] px-3 py-1 text-sm text-white hover:bg-[#0f1762] disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'New Plan'}
      </button>
      <button
        type="button"
        onClick={handleRename}
        disabled={!user?.uid || isBusy || !userProfile?.currentPlanId}
        className="rounded border border-[#141D84] px-3 py-1 text-sm text-[#141D84] hover:bg-[#eef1ff] disabled:opacity-50"
      >
        {renaming ? 'Renaming...' : 'Rename'}
      </button>
    </div>
  );
};

export default PlanSwitcher;
