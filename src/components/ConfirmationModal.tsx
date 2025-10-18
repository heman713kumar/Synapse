import React from 'react';
import { XIcon } from './icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
        >
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white" aria-label="Close modal">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 id="confirmation-modal-title" className="text-2xl font-bold text-white mb-4">{title}</h2>
                <p className="text-gray-300 mb-8">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-white bg-[#374151] hover:bg-[#4b5563]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded-lg text-white shadow-md ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};