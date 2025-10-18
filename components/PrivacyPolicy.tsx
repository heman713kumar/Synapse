import React from 'react';
import { Page } from '../types';
import { ShieldCheckIcon } from './icons';

interface PrivacyPolicyProps {
    setPage: (page: Page) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ setPage }) => {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-[#1A1A24] p-8 rounded-2xl shadow-2xl border border-white/10">
                <button onClick={() => setPage('profile')} className="text-indigo-400 mb-6">&larr; Back to Profile</button>
                <div className="flex items-center space-x-3 mb-4">
                    <ShieldCheckIcon className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-3xl font-bold text-white">Community Guidelines</h1>
                </div>
                <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-indigo-400 max-w-none space-y-4">
                    <p>Welcome to the Thinker-Doer Platform. Our mission is to foster innovation and collaboration in a safe, respectful, and productive environment. By participating, you agree to abide by these guidelines.</p>
                    
                    <h2 className="text-xl font-semibold">1. Be Respectful and Constructive</h2>
                    <p>Treat all members with respect. Disagreements are natural, but they must be handled constructively. Personal attacks, harassment, hate speech, trolling, and any form of bullying are strictly prohibited.</p>

                    <h2 className="text-xl font-semibold">2. Protect Intellectual Property</h2>
                    <p>Only post ideas and content that you own or have the right to share. Do not infringe on copyrights, trademarks, or patents. Our blockchain timestamping feature is here to help establish proof of origin for your ideas.</p>

                    <h2 className="text-xl font-semibold">3. No Inappropriate Content</h2>
                    <p>Do not post content that is obscene, pornographic, graphically violent, or otherwise offensive. This is a professional platform for innovation, not a social media site for personal expression.</p>
                    
                    <h2 className="text-xl font-semibold">4. No Spam or Scams</h2>
                    <p>Do not use the platform for unsolicited advertising, spam, or fraudulent activities. All content should be relevant to the purpose of ideation and collaboration.</p>

                    <h2 className="text-xl font-semibold">5. Moderation and Enforcement</h2>
                    <p>We provide a reporting mechanism for any content or user that violates these guidelines. Our moderation team will review all reports. Violations may result in content removal, temporary suspension, or permanent banning from the platform.</p>

                    <p className="pt-4 border-t border-white/10">We believe in the power of this community to self-regulate and maintain a high standard of interaction. Thank you for contributing to a positive and innovative ecosystem.</p>
                </div>
            </div>
        </div>
    );
};