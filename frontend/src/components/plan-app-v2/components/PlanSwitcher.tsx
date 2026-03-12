import React, { useEffect, useState } from 'react';
import planGateway from '../../../services/planGateway/planGateway';
import { useAuth } from '../../../context/AuthContext';

interface PlanOption {
  id: string;
  name: string;
}

const PlanSwitcher: React.FC = () => {
  const { user, userProfile, setCurrentPlanId } = useAuth();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadPlans = async () => {
    if (!user?.uid) {
      setPlans([]);
      return;
    }
    setLoading(true);
    try {
      const nextPlans = await planGateway.listPlans(user.uid);
      setPlans(nextPlans);
    } catch (error) {
      console.error('[PlanSwitcher] Failed to list plans', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, [user?.uid, userProfile?.currentPlanId]);

  if (!user?.uid) return null;

  const handleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlanId = event.target.value;
    try {
      await setCurrentPlanId(selectedPlanId);
    } catch (error) {
      console.error('[PlanSwitcher] Failed to switch plan', error);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newPlanId = await planGateway.createPlan(user.uid, 'My Service Plan');
      await setCurrentPlanId(newPlanId);
      await loadPlans();
    } catch (error) {
      console.error('[PlanSwitcher] Failed to create plan', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <select
        value={userProfile?.currentPlanId ?? ''}
        onChange={handleSelect}
        className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
        disabled={loading || creating || plans.length === 0}
      >
        {plans.length === 0 ? (
          <option value="">{loading ? 'Loading plans...' : 'No plans available'}</option>
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
        disabled={creating}
        className="rounded bg-[#141D84] px-3 py-1 text-sm text-white hover:bg-[#0f1762] disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'New Plan'}
      </button>
    </div>
  );
};

export default PlanSwitcher;
