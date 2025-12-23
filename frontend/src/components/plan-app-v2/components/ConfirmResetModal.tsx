
import React from 'react';
import { usePlan } from '../context/PlanContext';

const ConfirmResetModal: React.FC = () => {
  const { state, dispatch } = usePlan();
  const { isOpen, rowName } = state.resetConfirmation;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Reset Task?
        </h3>
        <p className="text-gray-600 mb-6">
          Reset task "{rowName || 'Item'}"?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => dispatch({ type: 'CANCEL_RESET' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => dispatch({ type: 'CONFIRM_RESET' })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetModal;
