import React from 'react';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  elementName: string;
  hasChildren: boolean;
  style?: React.CSSProperties;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  onConfirm,
  onCancel,
  elementName,
  hasChildren,
  style,
}) => {
  return (
    <div
      className="delete-confirmation-popover"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '0.5em',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1em',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '200px',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={{ margin: '0 0 1em 0', fontSize: '0.9rem' }}>
        {hasChildren
          ? `Delete "${elementName}" and all its children?`
          : `Delete "${elementName}"?`}
      </p>
      <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          style={{
            padding: '0.5em 1em',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          style={{
            padding: '0.5em 1em',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
