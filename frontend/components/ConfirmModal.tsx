import React from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg w-full max-w-xl flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center">
            {destructive ? <AlertTriangle className="text-red-600 mr-2" /> : null}
            {title || 'Are you sure?'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">{cancelLabel}</button>
          <button
            onClick={() => onConfirm()}
            className={`px-4 py-2 rounded text-sm font-bold ${destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-teal-700'}`}
          >
            <Check className="mr-2 inline" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
