import React, { useState } from 'react';
import { User, Report } from '../types';
import { XIcon, FlagIcon } from './icons';
import { REPORT_REASONS } from '../constants';

interface ReportModalProps {
    contentId: string;
    contentType: 'idea' | 'comment' | 'user';
    contentTitle: string;
    currentUser: User;
    onClose: () => void;
    onSubmit: (reason: keyof typeof REPORT_REASONS, details: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
    contentId,
    contentType,
    contentTitle,
    currentUser,
    onClose,
    onSubmit,
}) => {
    const [reason, setReason] = useState<keyof typeof REPORT_REASONS>('spam');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!details.trim()) {
            alert('Please provide some details for your report.');
            return;
        }
        setIsSubmitting(true);
        await onSubmit(reason, details);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <div className="flex items-center space-x-3 mb-2">
                    <FlagIcon className="w-6 h-6 text-red-400" />
                    <h2 className="text-2xl font-bold text-white">Report Content</h2>
                </div>
                <p className="text-gray-400 mb-6">You are reporting: <span className="font-semibold text-indigo-400">{contentTitle}</span></p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Reason for reporting</label>
                        <select
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value as keyof typeof REPORT_REASONS)}
                            className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {Object.entries(REPORT_REASONS).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-1">Details</label>
                        <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={4}
                            required
                            placeholder={`Please provide specific details about why you are reporting this ${contentType}.`}
                            className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};