import React from 'react';
import { usePlan } from '../context/PlanContext';
import { findRowInTree } from '../utils/planHelpers';

const ConfirmDeleteModal: React.FC = () => {
  const { state, dispatch } = usePlan();
  const { isOpen, rowId } = state.deleteConfirmation;

  if (!isOpen || !rowId) return null;

  const row = findRowInTree(state.plan.root.children, rowId);
  const hasChildren = row && row.children && row.children.length > 0;
  const isActiveTask = row && row.type === 'checkbox' && row.checked > 0;
  const itemName = row ? (row.name || 'Unnamed Item') : 'Item';

  let title = 'Delete Item?';
  let message = `Are you sure you want to delete "${itemName}"?`;

  if (hasChildren) {
    title = 'Delete Item and Contents?';
    message = `"${itemName}" has nested items. Deleting it will also delete all its children. This action cannot be undone.`;
  } else if (isActiveTask) {
    title = 'Delete Active Task?';
    message = `"${itemName}" is currently active or completed. Are you sure you want to delete it?`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 transform transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => dispatch({ type: 'CANCEL_DELETE' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => dispatch({ type: 'CONFIRM_DELETE' })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;