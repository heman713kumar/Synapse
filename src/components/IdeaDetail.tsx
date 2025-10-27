// C:\Users\hemant\Downloads\synapse\src\components\IdeaDetail.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Idea, User, Page, CollaborationRequest, Comment, BlockchainRecord, Feedback, RecommendedCollaborator, AchievementId, ProgressStage, Milestone } from '../types';
// --- (FIX) Import only the default 'api' service ---
import api from '../services/backendApiService';
import { ReportModal } from './ReportModal';
import { PROGRESS_STAGES } from '../constants';
import {
    WifiOffIcon,
    XIcon,
    StarIcon,
    MoreVerticalIcon,
    FlagIcon,
    ShieldCheckIcon,
    UserPlusIcon,
    BarChartIcon,
    AlertTriangleIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    RocketIcon,
    PlusIcon,
    CheckCircleIcon,
    CalendarIcon,
    Edit3Icon,
    TrashIcon,
    MessageSquareIcon,
    LayoutTemplateIcon,
    LoaderIcon,
    CpuIcon,
    RefreshCwIcon
} from './icons';

// --- SUB-COMPONENTS FOR ROADMAP ---

const MilestoneFormModal: React.FC<{
    ideaId: string;
    milestone: Partial<Milestone> | null;
    onClose: () => void;
    onSave: (milestoneData: Milestone) => void;
}> = ({ ideaId, milestone, onClose, onSave }) => {
    const [title, setTitle] = useState(milestone?.title || '');
    const [description, setDescription] = useState(milestone?.description || '');
    const [targetDate, setTargetDate] = useState(milestone?.targetDate ? new Date(milestone.targetDate).toISOString().split('T')[0] : '');
    const [isSaving, setIsSaving] = useState(false);
    const [backendOnline, setBackendOnline] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !targetDate) {
            alert('Please fill out all fields.');
            return;
        }

        // --- (FIX 1/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        setIsSaving(true);
        try {
            const milestoneData = { title, description, targetDate: new Date(targetDate).toISOString() };
            let savedMilestone: Milestone;
            if (milestone?.id) {
                savedMilestone = await api.editMilestone(ideaId, milestone.id, milestoneData);
            } else {
                savedMilestone = await api.addMilestone(ideaId, milestoneData);
            }
            onSave(savedMilestone);
            onClose(); // Close modal after successful save
        } catch (error: any) {
            console.error("Failed to save milestone:", error);
            alert(`Failed to save milestone: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                {!backendOnline && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2">
                        <WifiOffIcon className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm">Backend service unavailable</span>
                    </div>
                )}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white mb-6">{milestone?.id ? 'Edit' : 'Add'} Milestone</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
                        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white" />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Cancel</button>
                        <button type="submit" disabled={isSaving || !backendOnline} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                           {isSaving ? 'Saving...' : 'Save Milestone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS FOR FEEDBACK & VOTING ---

const StarRating: React.FC<{ rating: number | undefined, setRating?: (rating: number) => void, size?: string }> = ({ rating = 0, setRating, size = "w-6 h-6" }) => { // Default rating to 0
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating?.(star)}
                    className={`text-gray-500 transition-colors ${setRating ? 'cursor-pointer' : 'cursor-default'} ${rating >= star ? 'text-yellow-400' : (setRating ? 'hover:text-yellow-300' : '')}`}
                    disabled={!setRating}
                    aria-label={`Rate ${star} out of 5 stars`}
                >
                    <StarIcon className={`${size} ${rating >= star ? 'fill-current' : ''}`} />
                </button>
            ))}
        </div>
    );
};

const FeedbackModal: React.FC<{
    idea: Idea;
    currentUser: User | null;
    onClose: () => void;
    onSubmit: (feedback: Feedback, unlockedAchievements: AchievementId[]) => void;
}> = ({ idea, currentUser, onClose, onSubmit }) => {
    // Initialize ratings to null or a non-zero default if appropriate
    const [ratings, setRatings] = useState<{ problemClarity: number | null, solutionViability: number | null, marketPotential: number | null }>({ problemClarity: null, solutionViability: null, marketPotential: null });
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendOnline, setBackendOnline] = useState(true);

    const handleRatingChange = (category: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Check if ratings are selected (not null)
        if (Object.values(ratings).some(r => r === null) || !comment.trim()) {
            alert('Please provide a rating for all categories and a comment.');
            return;
        }
        if (!currentUser) {
             alert("Please log in to submit feedback.");
             return;
        }

        // --- (FIX 2/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        setIsSubmitting(true);
        try {
            // Ensure ratings are numbers before sending
            const feedbackPayload = {
                 ideaId: idea.ideaId,
                 ratings: {
                     problemClarity: ratings.problemClarity ?? 0,
                     solutionViability: ratings.solutionViability ?? 0,
                     marketPotential: ratings.marketPotential ?? 0,
                 },
                 comment,
                 // Add fields expected by the backend, mapped from ratings if necessary
                 feasibility: ratings.solutionViability, // Example mapping
                 innovation: ratings.problemClarity, // Example mapping
                 marketPotential: ratings.marketPotential // Example mapping
            };
            const { feedback, unlockedAchievements } = await api.submitFeedback(feedbackPayload);
            onSubmit(feedback, unlockedAchievements || []); // Ensure array
            onClose();
        } catch (error: any) {
            console.error("Failed to submit feedback:", error);
            alert(`Failed to submit feedback: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                {!backendOnline && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2">
                        <WifiOffIcon className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm">Backend service unavailable</span>
                    </div>
                )}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white mb-2">Provide Feedback</h2>
                <p className="text-gray-400 mb-6">On idea: <span className="font-semibold text-indigo-400">{idea.title}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Problem Clarity</label><StarRating rating={ratings.problemClarity ?? 0} setRating={(r) => handleRatingChange('problemClarity', r)} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Solution Viability</label><StarRating rating={ratings.solutionViability ?? 0} setRating={(r) => handleRatingChange('solutionViability', r)} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Market Potential</label><StarRating rating={ratings.marketPotential ?? 0} setRating={(r) => handleRatingChange('marketPotential', r)} /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Comment</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !backendOnline} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FeedbackCard: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
    const [feedbackUser, setFeedbackUser] = useState<User | null>(null);
    const [backendOnline, setBackendOnline] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
             // Check userId exists before fetching
            if (!feedback.userId) return;

            // --- (FIX 3/13) Use api service and check boolean ---
            const isHealthy = await api.checkBackendHealth();
            if (!isHealthy) {
                setBackendOnline(false);
                return;
            }
            setBackendOnline(true);
            try {
                const user = await api.getUserById(feedback.userId);
                setFeedbackUser(user);
            } catch (error) {
                console.error('Failed to fetch feedback user:', error);
            }
        };
        fetchUser();
    }, [feedback.userId]);

    if (!backendOnline) {
        return (
            <div className="flex items-start space-x-3 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                <div className="flex-1 bg-red-900/20 border border-red-700/30 text-red-300 text-sm p-3 rounded-lg">
                    User data unavailable
                </div>
            </div>
        );
    }

    if (!feedbackUser) return <div className="bg-[#252532]/50 p-4 rounded-lg animate-pulse h-24"></div>;

    // Use backend fields if available, otherwise fallback to ratings object
    const feasibilityRating = feedback.feasibility ?? feedback.ratings?.problemClarity;
    const innovationRating = feedback.innovation ?? feedback.ratings?.solutionViability;
    const marketPotentialRating = feedback.marketPotential ?? feedback.market_potential ?? feedback.ratings?.marketPotential;


    return (
        <div className="flex items-start space-x-3 py-4">
            {/* --- (FIXED) Use displayName --- */}
            <img src={feedbackUser.avatarUrl || '/default-avatar.png'} alt={feedbackUser.displayName || 'User'} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
                 {/* --- (FIXED) Use displayName --- */}
                <div className="flex items-baseline space-x-2"><span className="font-semibold text-white">{feedbackUser.displayName || 'User'}</span><span className="text-xs text-gray-500">{new Date(feedback.createdAt || feedback.created_at!).toLocaleDateString()}</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 my-2 text-sm">
                    {/* Use combined ratings */}
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Problem:</span><StarRating rating={feasibilityRating} size="w-4 h-4" /></div>
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Solution:</span><StarRating rating={innovationRating} size="w-4 h-4" /></div>
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Potential:</span><StarRating rating={marketPotentialRating} size="w-4 h-4" /></div>
                </div>
                {feedback.comment && <p className="text-gray-300 mt-1 bg-[#252532]/50 p-3 rounded-lg">{feedback.comment}</p>}
            </div>
        </div>
    );
};


const CollaborationRequestModal: React.FC<{
    idea: Idea;
    onClose: () => void;
    onSubmit: (formData: { skills: string, contribution: string, motivation: string }) => void;
}> = ({ idea, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ skills: '', contribution: '', motivation: '' });
    const [backendOnline, setBackendOnline] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- (FIX 4/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);
        setIsSubmitting(true); // Set loading true

        try {
            await onSubmit(formData); // Let the parent handle API call and state
        } finally {
            setIsSubmitting(false); // Set loading false
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                {!backendOnline && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2">
                        <WifiOffIcon className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm">Backend service unavailable</span>
                    </div>
                )}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Request to Collaborate</h2>
                <p className="text-gray-400 mb-6">On idea: <span className="font-semibold text-indigo-400">{idea.title}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">What relevant skills/experience can you contribute?</label>
                        <textarea name="skills" value={formData.skills} onChange={handleInputChange} rows={3} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">What would you like to contribute?</label>
                        <textarea name="contribution" value={formData.contribution} onChange={handleInputChange} rows={3} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">What is your motivation for joining?</label>
                        <textarea name="motivation" value={formData.motivation} onChange={handleInputChange} rows={3} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={isSubmitting || !backendOnline} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestCard: React.FC<{
    request: CollaborationRequest,
    onApprove: (id: string) => void,
    onDeny: (id: string) => void,
}> = ({ request, onApprove, onDeny }) => {
    const [requester, setRequester] = useState<User | null>(null);
    const [backendOnline, setBackendOnline] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(true); // Added loading state for user

    useEffect(() => {
        const fetchUser = async () => {
             // Check requesterId exists
            if (!request.requesterId) {
                setIsLoadingUser(false);
                return;
            }
            setIsLoadingUser(true); // Set loading true before fetch
            // --- (FIX 5/13) Use api service and check boolean ---
            const isHealthy = await api.checkBackendHealth();
            if (!isHealthy) {
                setBackendOnline(false);
                setIsLoadingUser(false);
                return;
            }
            setBackendOnline(true);
            try {
                const user = await api.getUserById(request.requesterId);
                setRequester(user);
            } catch (error) {
                console.error('Failed to fetch requester:', error);
            } finally {
                setIsLoadingUser(false); // Set loading false after fetch attempt
            }
        };
        fetchUser();
    }, [request.requesterId]);

    if (!backendOnline) {
        return (
            <div className="bg-[#252532]/50 p-4 rounded-lg border border-red-700/30">
                <div className="text-red-300 text-sm text-center">User data unavailable</div>
            </div>
        );
    }

    // Show loader while fetching user
    if (isLoadingUser) return <div className="bg-[#252532]/50 p-4 rounded-lg animate-pulse h-40"></div>;
    // Show message if user couldn't be loaded
    if (!requester) return <div className="bg-[#252532]/50 p-4 rounded-lg"><p className="text-gray-500 text-sm">Could not load requester details.</p></div>;

    return (
        <div className="bg-[#252532]/50 p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
                 {/* --- (FIXED) Use displayName --- */}
                <img src={requester.avatarUrl || '/default-avatar.png'} alt={requester.displayName || 'User'} className="w-10 h-10 rounded-full object-cover" />
                <div>
                     {/* --- (FIXED) Use displayName --- */}
                    <h4 className="font-semibold text-white">{requester.displayName || 'User'}</h4>
                    <p className="text-xs text-gray-400">Sent on {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div><h5 className="font-semibold text-indigo-300">Skills/Experience</h5><p className="text-gray-300">{request.skills || 'Not provided'}</p></div>
                <div><h5 className="font-semibold text-indigo-300">Contribution</h5><p className="text-gray-300">{request.contribution || 'Not provided'}</p></div>
                <div><h5 className="font-semibold text-indigo-300">Motivation</h5><p className="text-gray-300">{request.motivation || 'Not provided'}</p></div>
            </div>
            {request.status === 'pending' && ( // Only show buttons if pending
                <div className="flex space-x-2 mt-4">
                    <button onClick={() => onApprove(request.requestId)} className="flex-1 bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700">Approve</button>
                    <button onClick={() => onDeny(request.requestId)} className="flex-1 bg-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-red-700">Deny</button>
                </div>
            )}
        </div>
    )
}


const CommentCard: React.FC<{ comment: Comment; onReport: (commentId: string) => void; isGuest: boolean; currentUser: User | null; }> = ({ comment, onReport, isGuest, currentUser }) => { // REMOVED onGuestAction from destructuring
    const [commenter, setCommenter] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [backendOnline, setBackendOnline] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
 // Added loading state

    useEffect(() => {
        const fetchUser = async () => {
             // Check userId exists
            if (!comment.userId) {
                 setIsLoadingUser(false);
                 return;
            }
            setIsLoadingUser(true); // Set loading true
            // --- (FIX 6/13) Use api service and check boolean ---
            const isHealthy = await api.checkBackendHealth();
            if (!isHealthy) {
                setBackendOnline(false);
                setIsLoadingUser(false);
                return;
            }
            setBackendOnline(true);
            try {
                const user = await api.getUserById(comment.userId);
                setCommenter(user);
            } catch (error) {
                console.error('Failed to fetch commenter:', error);
            } finally {
                 setIsLoadingUser(false); // Set loading false
            }
        };
        fetchUser();
    }, [comment.userId]);

    const timeAgo = (date: string | undefined): string => { // Handle undefined
        if (!date) return "unknown time";
         try {
            const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
            if (isNaN(seconds) || seconds < 0) return "just now";
            // ... (rest of timeAgo logic remains the same)
             let interval = seconds / 31536000;
             if (interval > 1) return Math.floor(interval) + " years ago";
             interval = seconds / 2592000;
             if (interval > 1) return Math.floor(interval) + " months ago";
             interval = seconds / 86400;
             if (interval > 1) return Math.floor(interval) + " days ago";
             interval = seconds / 3600;
             if (interval > 1) return Math.floor(interval) + " hours ago";
             interval = seconds / 60;
             if (interval > 1) return Math.floor(interval) + " minutes ago";
             return Math.max(0, Math.floor(seconds)) + " seconds ago";
        } catch(e) {
            console.error("Error formatting comment date:", date, e);
            return "unknown date";
        }
    };


    if (!backendOnline) {
        return (
            <div className="flex items-start space-x-3 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                <div className="flex-1 bg-red-900/20 border border-red-700/30 text-red-300 text-sm p-3 rounded-lg">
                    User data unavailable
                </div>
            </div>
        );
    }

     if (isLoadingUser) return ( // Show loader while fetching user
        <div className="flex items-start space-x-3 py-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
        </div>
    );

    if (comment.isUnderReview) {
        return (
            <div className="flex items-center space-x-3 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                <div className="flex-1 bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 text-sm p-3 rounded-lg">
                    This comment is currently under review.
                </div>
            </div>
        );
    }

    if (!commenter) return ( // Handle case where commenter couldn't be loaded
         <div className="flex items-start space-x-3 py-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
            <div className="flex-1">
                 <p className="text-gray-500 text-sm">Could not load commenter details.</p>
                 <p className="text-gray-300 mt-1">{comment.text}</p>
             </div>
        </div>
    );


    return (
        <div className="flex items-start space-x-3 py-4 group">
             {/* --- (FIXED) Use displayName --- */}
            <img src={commenter.avatarUrl || '/default-avatar.png'} alt={commenter.displayName || 'User'} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
                <div className="bg-[#252532]/50 p-3 rounded-lg rounded-tl-none relative">
                    <div className="flex items-baseline space-x-2">
                         {/* --- (FIXED) Use displayName --- */}
                        <span className="font-semibold text-white">{commenter.displayName || 'User'}</span>
                         {/* Use correct date property */}
                        <span className="text-xs text-gray-500">{timeAgo(comment.createdAt || comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300 mt-1">{comment.text}</p>
                    <div className="absolute top-2 right-2">
                         {/* Show report button only if NOT guest and NOT own comment */}
                         {!isGuest && currentUser?.userId !== comment.userId && (
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-white">
                                <MoreVerticalIcon className="w-4 h-4"/>
                            </button>
                         )}
                        {isMenuOpen && !isGuest && (
                            <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-[#374151] ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                    <button onClick={() => { onReport(comment.commentId || comment.id!); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
                                        <FlagIcon className="w-4 h-4" />
                                        <span>Report</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const BlockchainRecordCard: React.FC<{ record: BlockchainRecord }> = ({ record }) => {
  const [collaborator, setCollaborator] = useState<User | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isLoadingCollaborator, setIsLoadingCollaborator] = useState(false); // Loading state

  useEffect(() => {
    const fetchCollaborator = async () => {
      if (record.recordType === 'collaboration' && record.collaboratorId) {
        setIsLoadingCollaborator(true); // Set loading true
        // --- (FIX 7/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
          setBackendOnline(false);
          setIsLoadingCollaborator(false);
          return;
        }
        setBackendOnline(true);
        try {
          const user = await api.getUserById(record.collaboratorId);
          setCollaborator(user);
        } catch (error) {
          console.error('Failed to fetch collaborator:', error);
        } finally {
            setIsLoadingCollaborator(false); // Set loading false
        }
      }
    };
    fetchCollaborator();
  }, [record.recordType, record.collaboratorId]); // Depend on relevant properties


    const getRecordInfo = () => {
        switch (record.recordType) {
            case 'timestamp':
                return {
                    icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-400 flex-shrink-0" />,
                    title: 'Idea Timestamped',
                    description: 'The creation of this idea was permanently recorded on the blockchain.',
                };
            case 'collaboration':
                let collabDesc = 'A collaboration event was recorded.';
                if (isLoadingCollaborator) {
                    collabDesc = 'Loading collaborator details...';
                } else if (collaborator) {
                     // --- (FIXED) Use displayName ---
                     collabDesc = `${collaborator.displayName || 'A user'} officially joined the project.`;
                } else if (!backendOnline) {
                     collabDesc = 'Collaborator details unavailable (service offline).';
                } else {
                     collabDesc = 'Could not load collaborator details.';
                }
                return {
                    icon: <UserPlusIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />,
                    title: 'Collaboration Agreement',
                    description: collabDesc,
                };
            default:
                return {
                    icon: <ShieldCheckIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />,
                    title: 'Blockchain Event',
                    description: 'An event was recorded on the blockchain.',
                };
        }
    };

    const { icon, title, description } = getRecordInfo();
    const networkScanUrl = record.blockchainNetwork === 'Polygon' ? `https://polygonscan.com/tx/${record.transactionHash}` : `/#`; // Add other network explorers if needed

    return (
        <div className="bg-[#252532]/50 border border-white/10 rounded-lg p-4 flex items-start space-x-4">
            {icon}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
                <p className="text-xs text-gray-500 mt-2">
                    {/* Handle potential invalid date */}
                    {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'Date Unknown'} &middot; {record.blockchainNetwork || 'Unknown Network'}
                </p>
                {record.transactionHash && (
                    <p className="text-sm text-gray-400 mt-1 break-all">
                        Tx Hash:
                        <a
                            href={networkScanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-indigo-300 hover:underline ml-1 text-xs"
                            title={record.transactionHash} // Show full hash on hover
                        >
                             {/* Shorten hash */}
                            {`${record.transactionHash.substring(0, 6)}...${record.transactionHash.substring(record.transactionHash.length - 4)}`}
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
};


const RecommendedUserCard: React.FC<{ user: RecommendedCollaborator, setPage: (page: Page, id?:string) => void }> = ({ user, setPage }) => {
    // Default score to 0 if missing
    const score = user.matchScore ?? 0;
    const scoreColor = score > 85 ? 'text-emerald-400' : score > 70 ? 'text-yellow-400' : 'text-orange-400';

    return (
        <div className="bg-black/20 p-4 rounded-lg flex flex-col items-center text-center">
             <div className={`relative w-20 h-20`}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle
                        className={scoreColor}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) * (1 - score / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45" cx="50" cy="50"
                        style={{transform: 'rotate(-90deg)', transformOrigin: '50% 50%'}}
                    />
                </svg>
                 {/* --- (FIXED) Use displayName --- */}
                <img src={user.avatarUrl || '/default-avatar.png'} alt={user.displayName || 'User'} className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>
            <span className={`text-2xl font-bold mt-2 ${scoreColor}`}>{score}%</span>
            <span className="text-xs text-gray-400 -mt-1">Match</span>

             {/* --- (FIXED) Use displayName --- */}
            <h4 className="font-semibold text-white mt-3">{user.displayName || 'User'}</h4>
             {/* Safely map skills */}
            <p className="text-xs text-gray-400 mt-1">{(user.skills || []).map(s => s.skillName).slice(0,2).join(', ')}</p>

             {/* Safely access reason */}
            <p className="text-sm text-gray-300 my-3 italic h-10 line-clamp-2">"{user.reason || 'No specific reason provided.'}"</p>

            <button onClick={() => setPage('profile', user.userId)} className="w-full mt-auto bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-indigo-700">View Profile</button>
        </div>
    );
};


const ProgressTracker: React.FC<{
    currentStageId: ProgressStage | undefined; // Allow undefined
    isOwner: boolean;
    onUpdate: (stage: ProgressStage) => void;
}> = ({ currentStageId, isOwner, onUpdate }) => {
    // Default to 'idea-stage' if undefined
    const stageId = currentStageId || 'idea-stage';
    const currentStageIndex = PROGRESS_STAGES.findIndex(s => s.id === stageId);

    return (
        <div className="space-y-4">
            {PROGRESS_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                    <div key={stage.id} className="relative flex items-start">
                        {/* Vertical line connector */}
                        {index < PROGRESS_STAGES.length - 1 && (
                            <div className={`absolute top-5 left-5 -ml-px w-0.5 h-full ${isCompleted ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        )}
                        <button
                            disabled={!isOwner}
                            onClick={() => isOwner && onUpdate(stage.id)}
                            className="flex items-center space-x-3 z-10 w-full text-left disabled:cursor-not-allowed group"
                        >
                             {/* Stage indicator circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isCompleted ? 'bg-indigo-500 border-indigo-500' : isCurrent ? 'bg-indigo-500 border-indigo-500 ring-4 ring-indigo-500/30' : 'bg-gray-700 border-gray-600 group-hover:bg-gray-600 group-hover:border-gray-500'}`}>
                                {isCompleted && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                 {/* Optionally show index or icon for current/pending */}
                                 {!isCompleted && <span className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-gray-400'}`}>{index + 1}</span>}
                            </div>
                            <span className={`font-medium ${isCurrent || isCompleted ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{stage.name}</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};


interface IdeaDetailProps {
    ideaId: string;
    currentUser: User | null;
    isGuest: boolean;
    setPage: (page: Page, id?: string) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
    onGuestAction: () => void;
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({ ideaId, currentUser, isGuest, setPage, onAchievementsUnlock, onGuestAction }) => {
    const [idea, setIdea] = useState<Idea | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Added error state
    const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [requests, setRequests] = useState<CollaborationRequest[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'feedback' | 'comments'>('feedback');
    const [recommendedCollaborators, setRecommendedCollaborators] = useState<RecommendedCollaborator[]>([]);
    const [isRecsLoading, setIsRecsLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [reportingContent, setReportingContent] = useState<{ type: 'idea' | 'comment'; id: string; title: string; } | null>(null);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [backendOnline, setBackendOnline] = useState(true);

    const fetchIdeaData = useCallback(async (isInitialLoad: boolean) => {
        if (isInitialLoad) setIsLoading(true);

        // --- (FIX 8/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
         if (!isHealthy) {
            setBackendOnline(false);
            if (isInitialLoad) setIsLoading(false);
            setError("Backend service is currently unavailable."); // Set error
            return;
        }
        setBackendOnline(true);
        setError(null); // Clear error

        try {
            // Fetch core idea data first
            const ideaData = await api.getIdeaById(ideaId);
            setIdea(ideaData); // Set idea immediately

            if (ideaData) {
                 // Fetch dependent data concurrently
                 const [ownerData, requestsData, commentsData, blockchainData, feedbackData] = await Promise.all([
                    api.getUserById(ideaData.ownerId),
                    api.getCollaborationRequestsByIdeaId(ideaId),
                    api.getCommentsByIdeaId(ideaId),
                    api.getBlockchainRecordsByIdeaId(ideaId),
                    api.getFeedbackByIdeaId(ideaId)
                 ]);
                setOwner(ownerData);
                setRequests(requestsData || []); // Ensure array
                setComments(commentsData || []); // Ensure array
                setBlockchainRecords(blockchainData || []); // Ensure array
                setFeedbackList(feedbackData || []); // Ensure array
            } else {
                 setError("Idea not found."); // Set error if idea fetch fails
            }
        } catch (error) {
            console.error('Failed to fetch idea data:', error);
             setError("Failed to load idea details."); // Set error on any fetch failure
        } finally {
            if (isInitialLoad) setIsLoading(false);
        }
    }, [ideaId]);

    // Initial load and blockchain polling logic (adjusted)
    useEffect(() => {
        let intervalId: number | undefined;
        let isMounted = true; // Track mount status

        const startFetching = async () => {
            await fetchIdeaData(true); // Initial full load

            // Check blockchain records after initial load completes
            if (isMounted && idea) { // Check mount status and if idea loaded
                const records = await api.getBlockchainRecordsByIdeaId(ideaId);
                setBlockchainRecords(records || []); // Update records state

                // Start polling only if initially no records were found
                if (isMounted && (records || []).length === 0) {
                    console.log("Starting blockchain polling for idea:", ideaId);
                    intervalId = window.setInterval(async () => {
                         if (!isMounted) { // Stop polling if unmounted
                             clearInterval(intervalId);
                             return;
                         }
                        try {
                            const updatedRecords = await api.getBlockchainRecordsByIdeaId(ideaId);
                            if (isMounted && (updatedRecords || []).length > 0) {
                                console.log("Blockchain records found, stopping poll for idea:", ideaId);
                                setBlockchainRecords(updatedRecords || []);
                                // Optionally refetch idea if record means idea state changed
                                // const updatedIdea = await api.getIdeaById(ideaId);
                                // if (isMounted) setIdea(updatedIdea);
                                clearInterval(intervalId);
                            }
                        } catch (pollError) {
                            console.error("Error during blockchain poll:", pollError);
                            // Optionally stop polling after too many errors
                            clearInterval(intervalId);
                        }
                    }, 5000); // Poll every 5 seconds
                }
            }
        };

        startFetching();

        // Cleanup function
        return () => {
            isMounted = false; // Mark as unmounted
            if (intervalId) {
                console.log("Clearing blockchain poll interval for idea:", ideaId);
                clearInterval(intervalId);
            }
        };
    // Depend only on ideaId for initial fetch trigger
    }, [ideaId, fetchIdeaData]); // Include fetchIdeaData


    const fetchRecommendations = useCallback(async () => {
        setIsRecsLoading(true);
        // --- (FIX 9/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            setIsRecsLoading(false);
             alert("Cannot fetch recommendations: Backend service unavailable.");
            return;
        }
        setBackendOnline(true);

        try {
            const recommendations = await api.getRecommendedCollaborators(ideaId);
            setRecommendedCollaborators(recommendations || []); // Ensure array
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
             alert("Could not fetch recommendations at this time.");
        } finally {
            setIsRecsLoading(false);
        }
    }, [ideaId]);

    const handleRequestSubmit = async (formData: { skills: string, contribution: string, motivation: string }) => {
        if (!idea || !currentUser) return;

        // --- (FIX 10/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        try {
            await api.submitCollaborationRequest({ ideaId: idea.ideaId, ...formData });
            setCollaborationModalOpen(false);
            alert('Your collaboration request has been sent!');
            fetchIdeaData(false); // Refetch data to show pending status
        } catch (error: any) {
             console.error("Failed to submit collaboration request:", error);
            alert(`Failed to submit request: ${error.message || 'Unknown error'}`);
        }
    };

    const handleUpdateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => { // Use 'rejected'
        // --- (FIX 11/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        try {
            const response = await api.updateCollaborationRequestStatus(requestId, status); // Pass 'approved' or 'rejected'
            onAchievementsUnlock(response?.unlockedAchievements || []); // Safely access unlockedAchievements
            fetchIdeaData(false); // Refetch data
        } catch (error: any) {
             console.error(`Failed to ${status} request:`, error);
            alert(`Failed to update request: ${error.message || 'Unknown error'}`);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGuest) {
            onGuestAction();
            return;
        }
        if (!newComment.trim() || !idea || !currentUser) return;

        // --- (FIX 12/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        setIsPostingComment(true);
        try {
            const postedComment = await api.postComment(idea.ideaId, newComment);
            setComments(prev => [...prev, postedComment]);
             // Update comment count on idea state
            setIdea(prev => prev ? ({ ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 }) : null);
            setNewComment('');
        } catch (error: any) {
            console.error("Failed to post comment:", error);
            alert(`Failed to post comment: ${error.message || 'Unknown error'}`);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (isGuest) {
            onGuestAction();
            return;
        }
        if (!idea || !currentUser) return;

        // --- (FIX 13/13) Use api service and check boolean ---
        const isHealthy = await api.checkBackendHealth();
         if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        // Optimistic UI update (optional but good UX)
        const currentVote = (idea.votes || []).find(v => v.userId === currentUser.userId)?.type;
        const optimisticVotes = [...(idea.votes || [])];
        const voteIndex = optimisticVotes.findIndex(v => v.userId === currentUser.userId);

        if (currentVote === type) { // Undoing vote
            if (voteIndex > -1) optimisticVotes.splice(voteIndex, 1);
        } else { // Adding or changing vote
             if (voteIndex > -1) optimisticVotes.splice(voteIndex, 1);
             optimisticVotes.push({ userId: currentUser.userId, type });
        }
        setIdea(prev => prev ? { ...prev, votes: optimisticVotes } : null);


        try {
            // Send request to backend
            const updatedIdea = await api.castVote(idea.ideaId, type);
            // Sync with backend state (in case optimistic was wrong or counts changed)
            if (updatedIdea) {
                setIdea(updatedIdea);
            }
        } catch (error: any) {
             console.error("Vote failed:", error);
            alert(`Failed to cast vote: ${error.message || 'Unknown error'}`);
             // Revert optimistic update on failure
             fetchIdeaData(false);
        }
    };

    const handleFeedbackSubmit = (newFeedback: Feedback, unlockedAchievements: AchievementId[]) => {
        setFeedbackList(prev => [newFeedback, ...prev]);
        setFeedbackModalOpen(false);
        onAchievementsUnlock(unlockedAchievements);
    };

    const handleUpdateProgress = async (newStage: ProgressStage) => {
        if (!idea || !isOwner) return; // Add isOwner check

        const isHealthy = await api.checkBackendHealth(); // Re-check (this is another function)
         if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        try {
            const updatedIdea = await api.updateIdeaProgressStage(idea.ideaId, newStage);
            if (updatedIdea) {
                setIdea(updatedIdea); // Update local state
            }
        } catch (error: any) {
             console.error("Failed to update progress:", error);
            alert(`Failed to update progress: ${error.message || 'Unknown error'}`);
        }
    };

    const handleReportSubmit = async (reason: any, details: string) => {
        if (!reportingContent || !currentUser) return;

        const isHealthy = await api.checkBackendHealth(); // Re-check
        if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        try {
            await api.submitReport({
                contentType: reportingContent.type,
                contentId: reportingContent.id,
                reason,
                details,
            });
            setReportingContent(null);
            alert('Thank you for your report. Our team will review this shortly.');
            // Optionally refetch data if report affects visibility
            // fetchIdeaData(false);
        } catch (error: any) {
             console.error("Report submission failed:", error);
            alert(`Failed to submit report: ${error.message || 'Unknown error'}`);
        }
    };

     const handleDeleteMilestone = async (milestoneId: string) => {
        if (!idea) return; // Ensure idea is loaded
        if (window.confirm('Are you sure you want to delete this milestone?')) {
            const isHealthy = await api.checkBackendHealth(); // Re-check
            if (!isHealthy) {
                setBackendOnline(false);
                alert('Backend service is currently unavailable. Please try again later.');
                return;
            }
            setBackendOnline(true);

            try {
                await api.deleteMilestone(idea.ideaId, milestoneId);
                fetchIdeaData(false); // Refetch to update roadmap
            } catch (error: any) {
                 console.error("Failed to delete milestone:", error);
                alert(`Failed to delete milestone: ${error.message || 'Unknown error'}`);
            }
        }
    };

     const handleCompleteMilestone = async (milestoneId: string) => {
         if (!idea) return; // Ensure idea is loaded
        const isHealthy = await api.checkBackendHealth(); // Re-check
         if (!isHealthy) {
            setBackendOnline(false);
            alert('Backend service is currently unavailable. Please try again later.');
            return;
        }
        setBackendOnline(true);

        try {
            await api.completeMilestone(idea.ideaId, milestoneId);
            fetchIdeaData(false); // Refetch to update status and potentially trigger feed post
            alert('Milestone completed! A success story has been posted to the feed.');
            // Optionally trigger achievement unlock logic here or rely on backend response
        } catch (error: any) {
            console.error("Failed to complete milestone:", error);
            alert(`Failed to complete milestone: ${error.message || 'Unknown error'}`);
        }
    };

    // --- Re-checking the handlers I just modified...
    // `handleUpdateProgress` was missing its check. I'll add it.
    // `handleReportSubmit` was missing its check. I'll add it.
    // `handleDeleteMilestone` was missing its check. I'll add it.
    // `handleCompleteMilestone` was missing its check. I'll add it.
    
    // --- Re-reviewing my own fixes ---
    // Ah, I see I *did* add the checks in my head but missed copying them in the first pass.
    // Let me edit the code above to *add* the checks to `handleUpdateProgress`, `handleReportSubmit`, `handleDeleteMilestone`, and `handleCompleteMilestone`.
    
    // ...Okay, I've gone back and added the `checkBackendHealth` calls to those four functions. My original count of 13 was incorrect. It's 13 + 4 = 17.
    // Let me do a final find-and-replace to be certain.

    // 1. `MilestoneFormModal` -> `handleSubmit`
    // 2. `FeedbackModal` -> `handleSubmit`
    // 3. `FeedbackCard` -> `useEffect`
    // 4. `CollaborationRequestModal` -> `handleSubmit`
    // 5. `RequestCard` -> `useEffect`
    // 6. `CommentCard` -> `useEffect`
    // 7. `BlockchainRecordCard` -> `useEffect`
    // 8. `IdeaDetail` -> `fetchIdeaData`
    // 9. `IdeaDetail` -> `fetchRecommendations`
    // 10. `IdeaDetail` -> `handleRequestSubmit`
    // 11. `IdeaDetail` -> `handleUpdateRequestStatus`
    // 12. `IdeaDetail` -> `handlePostComment`
    // 13. `IdeaDetail` -> `handleVote`
    // 14. `IdeaDetail` -> `handleUpdateProgress`
    // 15. `IdeaDetail` -> `handleReportSubmit`
    // 16. `IdeaDetail` -> `handleDeleteMilestone`
    // 17. `IdeaDetail` -> `handleCompleteMilestone`
    
    // Yes, 17 fixes are needed. The code above *now* correctly reflects all 17 changes.


    const { upvotes, downvotes, userVote } = useMemo(() => {
        if (!idea) return { upvotes: 0, downvotes: 0, userVote: null };
        const votes = idea.votes || []; // Ensure votes is an array
        return {
            upvotes: votes.filter(v => v.type === 'up').length,
            downvotes: votes.filter(v => v.type === 'down').length,
            userVote: votes.find(v => v.userId === currentUser?.userId)?.type || null
        }
    }, [idea, currentUser?.userId]);

     if (isLoading) return <div className="flex items-center justify-center h-screen"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400"/></div>;
     if (error) return <div className="text-center p-8 text-red-400">{error}</div>; // Show error if fetch failed
     if (!idea || !owner) return <div className="text-center p-8 text-gray-500">Idea not found or owner data missing.</div>; // More specific message

    const isOwner = currentUser?.userId === idea.ownerId;
     // Safely check collaborators
    const isCollaborator = !!currentUser && (idea.collaborators || []).includes(currentUser.userId);
    const userRequest = currentUser ? (requests || []).find(r => r.requesterId === currentUser.userId) : null;
    const hasPendingRequest = userRequest?.status === 'pending';
    const hasGivenFeedback = currentUser ? (feedbackList || []).some(f => f.userId === currentUser.userId) : false;


    const renderActionButton = () => {
        if (isGuest) {
            return (
                <button onClick={onGuestAction} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90">
                    Sign Up to Collaborate
                </button>
            );
        }
        if (isOwner) {
            return (
                <button
                    onClick={() => setPage('analytics', idea.ideaId)}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 flex items-center justify-center space-x-2"
                >
                    <BarChartIcon className="w-5 h-5"/>
                    <span>View Analytics</span>
                </button>
            );
        }

        let buttonText = "Request to Collaborate"; // Changed default text
        let isDisabled = false;
        if(isCollaborator) { buttonText = "You are a Collaborator"; isDisabled = true; }
        else if (hasPendingRequest) { buttonText = "Collaboration Request Pending"; isDisabled = true; }

        return (
            <button
                onClick={() => setCollaborationModalOpen(true)}
                disabled={isDisabled || !backendOnline} // Disable if backend offline
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        );
    }

    const pendingRequests = (requests || []).filter(r => r.status === 'pending');
    // Ensure forumMembers is array before checking includes
    const canAccessForum = isOwner || (!!currentUser && (idea.forumMembers || []).includes(currentUser.userId));
    const showProjectBoard = idea.progressStage === 'in-development' || idea.progressStage === 'launched';
     // Ensure roadmap is array before sorting
    const sortedRoadmap = [...(idea.roadmap || [])].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    return (
        <>
            {collaborationModalOpen && currentUser && <CollaborationRequestModal idea={idea} onClose={() => setCollaborationModalOpen(false)} onSubmit={handleRequestSubmit} />}
            {feedbackModalOpen && <FeedbackModal idea={idea} currentUser={currentUser} onClose={() => setFeedbackModalOpen(false)} onSubmit={handleFeedbackSubmit} />}
            {reportingContent && currentUser && ( // Ensure currentUser exists for report modal
                <ReportModal
                    contentId={reportingContent.id}
                    contentType={reportingContent.type}
                    contentTitle={reportingContent.title}
                    currentUser={currentUser}
                    onClose={() => setReportingContent(null)}
                    onSubmit={handleReportSubmit}
                />
            )}
            {showMilestoneForm && isOwner && ( // Only show if owner
                <MilestoneFormModal
                    ideaId={idea.ideaId}
                    milestone={editingMilestone}
                    onClose={() => { setShowMilestoneForm(false); setEditingMilestone(null); }}
                    onSave={() => { // Refetch data after save
                        fetchIdeaData(false);
                        setShowMilestoneForm(false);
                        setEditingMilestone(null);
                    }}
                />
            )}

            <div className="container mx-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {!backendOnline && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-3">
                            <WifiOffIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-red-300">Backend Service Unavailable</h4>
                                <p className="text-red-200 text-sm">Some features may not work properly. Please try again later.</p>

                            </div>
                        </div>
                    )}
                     {idea.isUnderReview && (
                        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 text-sm p-4 rounded-lg mb-6 flex items-start space-x-3">
                            <AlertTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Content Under Review</h4>
                                <p>This idea has been reported and is currently under review.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                        <button onClick={() => setPage('feed')} className="text-indigo-400 mb-4 hover:underline">&larr; Back to Feed</button>
                         <div className="relative">
                             {/* Show report button only if NOT guest */}
                            {!isGuest && (
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-white/10">
                                    <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                            {isMenuOpen && !isGuest && (
                                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[#252532] ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setReportingContent({ type: 'idea', id: idea.ideaId, title: `the idea "${idea.title}"` });
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                                        >
                                            <FlagIcon className="w-4 h-4" />
                                            <span>Report Idea</span>
                                        </button>
                                         {/* Add Edit Idea button for owner */}
                                         {isOwner && (
                                            <button
                                                onClick={() => { /* TODO: Implement edit idea navigation/modal */ alert("Edit idea not implemented"); setIsMenuOpen(false); }}
                                                className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                                            >
                                                <Edit3Icon className="w-4 h-4" />
                                                <span>Edit Idea</span>
                                            </button>
                                         )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row items-start gap-x-6">
                        <div className="flex flex-col items-center space-y-2 mt-2 flex-shrink-0">
                            <button
                                onClick={() => handleVote('up')}
                                disabled={isGuest || !backendOnline} // Disable if guest or offline
                                className={`p-2 rounded-full transition-colors ${userVote === 'up' ? 'bg-indigo-600 text-white' : 'bg-[#252532] hover:bg-[#374151] disabled:opacity-50'}`}
                                aria-label="Upvote"
                            >
                                <ArrowUpIcon className="w-6 h-6"/>
                            </button>
                            <span className="font-bold text-xl text-white">{upvotes - downvotes}</span>
                            <button
                                onClick={() => handleVote('down')}
                                disabled={isGuest || !backendOnline} // Disable if guest or offline
                                className={`p-2 rounded-full transition-colors ${userVote === 'down' ? 'bg-red-600 text-white' : 'bg-[#252532] hover:bg-[#374151] disabled:opacity-50'}`}
                                aria-label="Downvote"
                            >
                                <ArrowDownIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="flex-1 min-w-0"> {/* Allow content to wrap */}
                            <h1 className="text-4xl font-bold text-white mb-6">{idea.title}</h1>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Summary */}
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h2 className="text-xl font-semibold text-white mb-2">Summary</h2>
                                        <p className="text-gray-300 whitespace-pre-wrap">{idea.summary}</p> {/* Use pre-wrap for newlines */}
                                    </div>
                                    
                                    {/* Description (if exists) */}
                                     {idea.description && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
                                            <p className="text-gray-300 whitespace-pre-wrap">{idea.description}</p>
                                        </div>
                                     )}

                                     {/* Questionnaire */}
                                    {idea.questionnaire && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <h2 className="text-xl font-semibold text-white mb-4">Ideation Details</h2>
                                            <div className="space-y-4 text-sm">
                                                <div><h3 className="font-semibold text-indigo-300">Problem Statement</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.problemStatement || 'Not provided'}</p></div>
                                                <div><h3 className="font-semibold text-indigo-300">Target Audience</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.targetAudience || 'Not provided'}</p></div>
                                                <div><h3 className="font-semibold text-indigo-300">Resources Needed</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.resourcesNeeded || 'Not provided'}</p></div>
                                                 {/* Add other questionnaire fields */}
                                                <div><h3 className="font-semibold text-indigo-300">Timeline</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.timeline || 'Not provided'}</p></div>
                                                <div><h3 className="font-semibold text-indigo-300">Skills Looking For</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.skillsLooking || 'Not provided'}</p></div>
                                                <div><h3 className="font-semibold text-indigo-300">Vision for Success</h3><p className="text-gray-300 whitespace-pre-wrap">{idea.questionnaire.visionForSuccess || 'Not provided'}</p></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Roadmap */}
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                                                <RocketIcon className="w-6 h-6 text-cyan-400" />
                                                <span>Project Roadmap</span>
                                            </h2>
                                            {isOwner && (
                                                <button onClick={() => { setEditingMilestone(null); setShowMilestoneForm(true); }} className="flex items-center space-x-2 bg-[#252532] hover:bg-[#374151] px-3 py-1.5 text-sm rounded-lg disabled:opacity-50" disabled={!backendOnline}>
                                                    <PlusIcon className="w-4 h-4" />
                                                    <span>Add Milestone</span>
                                                </button>
                                            )}
                                        </div>
                                        {sortedRoadmap.length > 0 ? (
                                            <div className="space-y-4">
                                                {sortedRoadmap.map(m => (
                                                    <div key={m.id} className={`p-4 rounded-lg border ${m.status === 'completed' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-black/20 border-white/10'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center space-x-3">
                                                                    {m.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex-shrink-0" />}
                                                                    <h3 className="font-bold text-white">{m.title}</h3>
                                                                </div>
                                                                <p className="text-sm text-gray-400 mt-2 pl-8">{m.description}</p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0 ml-4">
                                                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                                                    <CalendarIcon className="w-4 h-4"/>
                                                                    <span>{new Date(m.targetDate).toLocaleDateString()}</span>
                                                                </div>
                                                                {isOwner && (
                                                                    <div className="mt-2 space-x-2">
                                                                        <button onClick={() => { setEditingMilestone(m); setShowMilestoneForm(true); }} className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50" disabled={!backendOnline}><Edit3Icon className="w-4 h-4 text-gray-400"/></button>
                                                                        <button onClick={() => handleDeleteMilestone(m.id)} className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50" disabled={!backendOnline}><TrashIcon className="w-4 h-4 text-gray-400"/></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isOwner && m.status === 'pending' && (
                                                            <div className="pl-8 pt-3 mt-3 border-t border-white/10">
                                                                <button onClick={() => handleCompleteMilestone(m.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 disabled:opacity-50" disabled={!backendOnline}>
                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                    <span>Mark as Complete</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 py-4 text-center">No roadmap defined yet. {isOwner && "Add the first milestone to get started."}</p>
                                        )}
                                    </div>

                                    {/* Feedback & Comments Tabs */}
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-4">Community Refinement</h2>
                                        <div className="border-b border-white/10 mb-4">
                                            <div role="tablist" className="-mb-px flex space-x-6" aria-label="Community content">
                                                <button role="tab" id="feedback-tab" aria-controls="feedback-panel" aria-selected={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'feedback' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'}`}>
                                                    Feedback <span className="bg-[#252532] text-xs px-2 py-0.5 rounded-full">{(feedbackList || []).length}</span>
                                                </button>
                                                <button role="tab" id="comments-tab" aria-controls="comments-panel" aria-selected={activeTab === 'comments'} onClick={() => setActiveTab('comments')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'}`}>
                                                    Comments <span className="bg-[#252532] text-xs px-2 py-0.5 rounded-full">{idea.commentsCount ?? 0}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div id="feedback-panel" role="tabpanel" tabIndex={0} aria-labelledby="feedback-tab" hidden={activeTab !== 'feedback'}>
                                            <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                                {(feedbackList || []).length > 0 ? (
                                                    <div className="space-y-2 divide-y divide-white/10">
                                                        {feedbackList.map(fb => <FeedbackCard key={fb.feedbackId || (fb as any).id} feedback={fb} />)}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 py-4 text-center">No feedback yet. Be the first to provide a review!</p>
                                                )}
                                                 {!isOwner && !isGuest && (
                                                    <button
                                                        onClick={() => setFeedbackModalOpen(true)}
                                                        disabled={hasGivenFeedback || !backendOnline}
                                                        className="mt-6 w-full bg-[#374151] text-white px-6 py-3 rounded-lg hover:bg-[#4b5563] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                                    >
                                                        <StarIcon className="w-5 h-5" />
                                                        <span>{hasGivenFeedback ? "Feedback Submitted" : "Provide Feedback"}</span>
                                                    </button>
                                                 )}
                                            </div>
                                        </div>

                                        <div id="comments-panel" role="tabpanel" tabIndex={0} aria-labelledby="comments-tab" hidden={activeTab !== 'comments'}>
                                            <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                                <div className="space-y-2 divide-y divide-white/10">
                                                    {(comments || []).length > 0 ? (
                                                        comments.map(comment => <CommentCard key={comment.commentId || (comment as any).id} comment={comment} onReport={(id) => setReportingContent({ type: 'comment', id, title: 'a comment' })} isGuest={isGuest} currentUser={currentUser}  />)
                                                    ) : (
                                                        <p className="text-gray-500 py-4">Be the first to comment.</p>
                                                    )}
                                                </div>
                                                {!isGuest && (
                                                    <form onSubmit={handlePostComment} className="mt-6 flex items-start space-x-3">
                                                        {currentUser && <img src={currentUser.avatarUrl || '/default-avatar.png'} alt={currentUser.displayName} className="w-10 h-10 rounded-full object-cover" />}
                                                        <div className="flex-1">
                                                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a public comment..." rows={2} className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                                            <div className="flex justify-end mt-2">
                                                                <button type="submit" disabled={isPostingComment || !newComment.trim() || !backendOnline} className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                                                    {isPostingComment ? 'Posting...' : 'Post Comment'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                )}
                                                {isGuest && (
                                                     <div className="mt-6 text-center">
                                                         <button onClick={onGuestAction} className="text-indigo-400 hover:underline">Log in or sign up to comment</button>
                                                     </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="lg:col-span-1 space-y-6">
                                     {/* Owner Info Card */}
                                     <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Owner</h3>
                                         <button onClick={() => setPage('profile', owner.userId)} className="flex items-center space-x-3 group w-full text-left">
                                             <img src={owner.avatarUrl || '/default-avatar.png'} alt={owner.displayName} className="w-12 h-12 rounded-full object-cover" />
                                             <div>
                                                 <h4 className="font-semibold text-white group-hover:text-indigo-400">{owner.displayName}</h4>
                                                 <p className="text-sm text-gray-400">@{owner.username}</p>
                                             </div>
                                         </button>
                                     </div>

                                     {/* Project Status/Progress */}
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Project Status</h3>
                                        <ProgressTracker currentStageId={idea.progressStage} isOwner={isOwner} onUpdate={handleUpdateProgress} />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-4">
                                        {renderActionButton()}
                                        <div className="flex space-x-4">
                                            {/* Show Forum/Board buttons only if allowed */}
                                            {canAccessForum && (
                                                <button onClick={() => setPage('forum', idea.ideaId)} className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50" disabled={!backendOnline}>
                                                    <MessageSquareIcon className="w-5 h-5"/>
                                                    <span>Discussion</span>
                                                </button>
                                            )}
                                            {showProjectBoard && (
                                                <button onClick={() => setPage('kanban', idea.ideaId)} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50" disabled={!backendOnline}>
                                                    <LayoutTemplateIcon className="w-5 h-5"/>
                                                    <span>Project Board</span>
                                                </button>
                                            )}
                                        </div>
                                         {/* Always show Idea Board button? Or only if not guest? */}
                                         {!isGuest && (
                                             <button onClick={() => setPage('ideaBoard', idea.ideaId)} className="w-full bg-[#374151] text-white px-4 py-2.5 rounded-lg disabled:opacity-50" disabled={!backendOnline}>
                                                View Idea Board
                                            </button>
                                         )}
                                    </div>

                                    {/* Blockchain Activity */}
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Blockchain Activity</h3>
                                        {(blockchainRecords || []).length > 0 ? (
                                            <div className="space-y-4">
                                                {blockchainRecords.map(record => (
                                                    <BlockchainRecordCard key={record.recordId || record.transactionHash} record={record} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-700/30 border border-gray-500/30 rounded-lg p-4 flex items-center space-x-3">
                                                <LoaderIcon className="w-5 h-5 text-indigo-400 animate-spin" />
                                                <p className="text-sm text-gray-400">Waiting for blockchain activity...</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collaboration Requests (Owner only) */}
                                    {isOwner && pendingRequests.length > 0 && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <h2 className="text-xl font-semibold text-white mb-4">Collaboration Requests ({pendingRequests.length})</h2>
                                            <div className="grid grid-cols-1 gap-4">
                                                {pendingRequests.map(req => (
                                                    <RequestCard key={req.requestId} request={req} onApprove={(id) => handleUpdateRequestStatus(id, 'approved')} onDeny={(id) => handleUpdateRequestStatus(id, 'rejected')} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                     {/* AI Recommendations (Owner only, maybe collaborators too?) */}
                                    {(isOwner || isCollaborator) && !isGuest && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                                    <CpuIcon className="w-5 h-5 text-indigo-400" />
                                                    <span>AI Recommendations</span>
                                                </h2>
                                                <button onClick={fetchRecommendations} disabled={isRecsLoading || !backendOnline} className="p-2 rounded-full bg-[#252532] hover:bg-[#374151] disabled:opacity-50">
                                                    <RefreshCwIcon className={`w-4 h-4 ${isRecsLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                            {isRecsLoading ? (
                                                <div className="text-center py-8">
                                                    <LoaderIcon className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                                                </div>
                                            ) : (recommendedCollaborators || []).length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                                    {recommendedCollaborators.slice(0, 2).map(user => (
                                                        <RecommendedUserCard key={user.userId} user={user} setPage={setPage} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-center text-gray-500 py-4">Click refresh to get AI-powered collaborator matches based on required skills.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};