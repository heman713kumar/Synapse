
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Idea, User, Page, CollaborationRequest, Comment, BlockchainRecord, Feedback, RecommendedCollaborator, AchievementId, ProgressStage, Milestone } from '../types';
import { api } from '../services/mockApiService';
import { XIcon, MessageSquareIcon, ShieldCheckIcon, LoaderIcon, UserPlusIcon, ArrowUpIcon, ArrowDownIcon, StarIcon, CpuIcon, RefreshCwIcon, MoreVerticalIcon, FlagIcon, AlertTriangleIcon, BarChartIcon, PlusIcon, Edit3Icon, TrashIcon, CheckCircleIcon, RocketIcon, CalendarIcon, LayoutTemplateIcon } from './icons';
import { ReportModal } from './ReportModal';
import { PROGRESS_STAGES } from '../constants';

// --- SUB-COMPONENTS FOR ROADMAP ---

const MilestoneFormModal: React.FC<{
    milestone: Partial<Milestone> | null;
    onClose: () => void;
    onSave: (data: Omit<Milestone, 'id' | 'status' | 'completedAt'>) => void;
}> = ({ milestone, onClose, onSave }) => {
    const [title, setTitle] = useState(milestone?.title || '');
    const [description, setDescription] = useState(milestone?.description || '');
    const [targetDate, setTargetDate] = useState(milestone?.targetDate ? new Date(milestone.targetDate).toISOString().split('T')[0] : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !targetDate) {
            alert('Please fill out all fields.');
            return;
        }
        onSave({ title, description, targetDate: new Date(targetDate).toISOString() });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white mb-6">{milestone ? 'Edit' : 'Add'} Milestone</h2>
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
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90">Save Milestone</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS FOR FEEDBACK & VOTING ---

const StarRating: React.FC<{ rating: number, setRating?: (rating: number) => void, size?: string }> = ({ rating, setRating, size = "w-6 h-6" }) => {
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating?.(star)}
                    className={`text-gray-500 transition-colors ${setRating ? 'cursor-pointer' : 'cursor-default'} ${rating >= star ? 'text-yellow-400' : 'hover:text-yellow-300'}`}
                    disabled={!setRating}
                >
                    <StarIcon className={`${size} ${rating >= star ? 'fill-current' : ''}`} />
                </button>
            ))}
        </div>
    );
};

const FeedbackModal: React.FC<{
    idea: Idea;
    currentUser: User;
    onClose: () => void;
    onSubmit: (feedback: Feedback, unlockedAchievements: AchievementId[]) => void;
}> = ({ idea, currentUser, onClose, onSubmit }) => {
    const [ratings, setRatings] = useState({ problemClarity: 0, solutionViability: 0, marketPotential: 0 });
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingChange = (category: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(ratings).some(r => r === 0) || !comment.trim()) {
            alert('Please provide a rating for all categories and a comment.');
            return;
        }
        setIsSubmitting(true);
        const { feedback, unlockedAchievements } = await api.submitFeedback({
            ideaId: idea.ideaId,
            userId: currentUser.userId,
            ratings,
            comment,
        });
        onSubmit(feedback, unlockedAchievements);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white mb-2">Provide Feedback</h2>
                <p className="text-gray-400 mb-6">On idea: <span className="font-semibold text-indigo-400">{idea.title}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Problem Clarity</label><StarRating rating={ratings.problemClarity} setRating={(r) => handleRatingChange('problemClarity', r)} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Solution Viability</label><StarRating rating={ratings.solutionViability} setRating={(r) => handleRatingChange('solutionViability', r)} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium text-gray-300">Market Potential</label><StarRating rating={ratings.marketPotential} setRating={(r) => handleRatingChange('marketPotential', r)} /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Comment</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} required className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
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

    useEffect(() => {
        api.getUserById(feedback.userId).then(setFeedbackUser);
    }, [feedback.userId]);

    if (!feedbackUser) return <div className="bg-[#252532]/50 p-4 rounded-lg animate-pulse h-24"></div>;

    return (
        <div className="flex items-start space-x-3 py-4">
            <img src={feedbackUser.avatarUrl} alt={feedbackUser.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <div className="flex items-baseline space-x-2"><span className="font-semibold text-white">{feedbackUser.name}</span><span className="text-xs text-gray-500">{new Date(feedback.createdAt).toLocaleDateString()}</span></div>
                <div className="grid grid-cols-3 gap-x-4 my-2 text-sm">
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Problem:</span><StarRating rating={feedback.ratings.problemClarity} size="w-4 h-4" /></div>
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Solution:</span><StarRating rating={feedback.ratings.solutionViability} size="w-4 h-4" /></div>
                    <div className="flex items-center space-x-1"><span className="text-gray-400">Potential:</span><StarRating rating={feedback.ratings.marketPotential} size="w-4 h-4" /></div>
                </div>
                <p className="text-gray-300 mt-1 bg-[#252532]/50 p-3 rounded-lg">{feedback.comment}</p>
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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full p-8 relative">
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
                        <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90">Submit Request</button>
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

    useEffect(() => {
        api.getUserById(request.requesterId).then(setRequester);
    }, [request.requesterId]);

    if (!requester) return <div className="bg-[#252532]/50 p-4 rounded-lg animate-pulse"></div>;

    return (
        <div className="bg-[#252532]/50 p-4 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
                <img src={requester.avatarUrl} alt={requester.name} className="w-10 h-10 rounded-full" />
                <div>
                    <h4 className="font-semibold text-white">{requester.name}</h4>
                    <p className="text-xs text-gray-400">Sent on {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div><h5 className="font-semibold text-indigo-300">Skills/Experience</h5><p className="text-gray-300">{request.skills}</p></div>
                <div><h5 className="font-semibold text-indigo-300">Contribution</h5><p className="text-gray-300">{request.contribution}</p></div>
                <div><h5 className="font-semibold text-indigo-300">Motivation</h5><p className="text-gray-300">{request.motivation}</p></div>
            </div>
            <div className="flex space-x-2 mt-4">
                <button onClick={() => onApprove(request.requestId)} className="flex-1 bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700">Approve</button>
                <button onClick={() => onDeny(request.requestId)} className="flex-1 bg-red-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-red-700">Deny</button>
            </div>
        </div>
    )
}

const CommentCard: React.FC<{ comment: Comment; onReport: (commentId: string) => void; isGuest: boolean; onGuestAction: () => void; }> = ({ comment, onReport, isGuest, onGuestAction }) => {
    const [commenter, setCommenter] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    useEffect(() => {
        api.getUserById(comment.userId).then(setCommenter);
    }, [comment.userId]);
    
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
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
        return Math.floor(seconds) + " seconds ago";
    };

    if (comment.isUnderReview) {
        return (
            <div className="flex items-center space-x-3 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                <div className="flex-1 bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 text-sm p-3 rounded-lg">
                    This comment is currently under review for a potential violation of community guidelines.
                </div>
            </div>
        );
    }
    
    if (!commenter) return (
        <div className="flex items-start space-x-3 py-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
        </div>
    );

    return (
        <div className="flex items-start space-x-3 py-4 group">
            <img src={commenter.avatarUrl} alt={commenter.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <div className="bg-[#252532]/50 p-3 rounded-lg rounded-tl-none relative">
                    <div className="flex items-baseline space-x-2">
                        <span className="font-semibold text-white">{commenter.name}</span>
                        <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 mt-1">{comment.text}</p>
                    <div className="absolute top-2 right-2">
                        <button onClick={() => isGuest ? onGuestAction() : setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10">
                            <MoreVerticalIcon className="w-4 h-4"/>
                        </button>
                        {isMenuOpen && !isGuest && (
                            <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-[#374151] ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                    <button onClick={() => { onReport(comment.commentId); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
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

    useEffect(() => {
        if (record.recordType === 'collaboration' && record.collaboratorId) {
            api.getUserById(record.collaboratorId).then(setCollaborator);
        }
    }, [record]);

    const getRecordInfo = () => {
        switch (record.recordType) {
            case 'timestamp':
                return {
                    icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-400 flex-shrink-0" />,
                    title: 'Idea Timestamped',
                    description: 'The creation of this idea was permanently recorded on the blockchain.',
                };
            case 'collaboration':
                return {
                    icon: <UserPlusIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />,
                    title: 'Collaboration Agreement',
                    description: `${collaborator ? collaborator.name : 'A user'} officially joined the project.`,
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

    return (
        <div className="bg-[#252532]/50 border border-white/10 rounded-lg p-4 flex items-start space-x-4">
            {icon}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
                <p className="text-xs text-gray-500 mt-2">
                    {new Date(record.timestamp).toLocaleString()} &middot; {record.blockchainNetwork}
                </p>
                <p className="text-sm text-gray-400 mt-1 break-all">
                    Tx Hash:
                    <a
                        href={`https://polygonscan.com/tx/${record.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-indigo-300 hover:underline ml-1 text-xs"
                    >
                        {record.transactionHash}
                    </a>
                </p>
            </div>
        </div>
    );
};

const RecommendedUserCard: React.FC<{ user: RecommendedCollaborator, setPage: (page: Page, id?:string) => void }> = ({ user, setPage }) => {
    const scoreColor = user.matchScore > 85 ? 'text-emerald-400' : user.matchScore > 70 ? 'text-yellow-400' : 'text-orange-400';
    
    return (
        <div className="bg-black/20 p-4 rounded-lg flex flex-col items-center text-center">
             <div className={`relative w-20 h-20`}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle 
                        className={scoreColor}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) * (1 - user.matchScore / 100)}
                        strokeLinecap="round"
                        stroke="currentColor" 
                        fill="transparent" 
                        r="45" cx="50" cy="50"
                        style={{transform: 'rotate(-90deg)', transformOrigin: '50% 50%'}}
                    />
                </svg>
                <img src={user.avatarUrl} alt={user.name} className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className={`text-2xl font-bold mt-2 ${scoreColor}`}>{user.matchScore}%</span>
            <span className="text-xs text-gray-400 -mt-1">Match</span>

            <h4 className="font-semibold text-white mt-3">{user.name}</h4>
            <p className="text-xs text-gray-400 mt-1">{user.skills.map(s => s.skillName).slice(0,2).join(', ')}</p>
            
            <p className="text-sm text-gray-300 my-3 italic">"{user.reason}"</p>

            <button onClick={() => setPage('profile', user.userId)} className="w-full mt-auto bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-indigo-700">View Profile</button>
        </div>
    );
};

const ProgressTracker: React.FC<{
    currentStageId: ProgressStage;
    isOwner: boolean;
    onUpdate: (stage: ProgressStage) => void;
}> = ({ currentStageId, isOwner, onUpdate }) => {
    const currentStageIndex = PROGRESS_STAGES.findIndex(s => s.id === currentStageId);

    return (
        <div className="space-y-4">
            {PROGRESS_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                    <div key={stage.id} className="relative flex items-start">
                        {index < PROGRESS_STAGES.length - 1 && (
                            <div className={`absolute top-5 left-5 w-0.5 h-full ${isCompleted ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        )}
                        <button
                            disabled={!isOwner}
                            onClick={() => isOwner && onUpdate(stage.id)}
                            className="flex items-center space-x-3 z-10 w-full text-left disabled:cursor-not-allowed group"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-indigo-500' : isCurrent ? 'bg-indigo-500 ring-4 ring-indigo-500/30' : 'bg-gray-600 group-hover:bg-gray-500'}`}>
                                {isCompleted && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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


    const fetchIdeaData = useCallback(async (isInitialLoad: boolean) => {
        if (isInitialLoad) setIsLoading(true);
        const ideaData = await api.getIdeaById(ideaId);
        setIdea(ideaData);
        if (ideaData) {
            api.getUserById(ideaData.ownerId).then(setOwner);
            api.getCollaborationRequestsByIdeaId(ideaId).then(setRequests);
            api.getCommentsByIdeaId(ideaId).then(setComments);
            api.getBlockchainRecordsByIdeaId(ideaId).then(setBlockchainRecords);
            api.getFeedbackByIdeaId(ideaId).then(setFeedbackList);
        }
        if (isInitialLoad) setIsLoading(false);
    }, [ideaId]);
    
    useEffect(() => {
        let intervalId: number | undefined;

        const startFetching = async () => {
            await fetchIdeaData(true);
            const records = await api.getBlockchainRecordsByIdeaId(ideaId);
            if (records.length === 0) {
                intervalId = window.setInterval(async () => {
                    const updatedRecords = await api.getBlockchainRecordsByIdeaId(ideaId);
                    if (updatedRecords.length > 0) {
                        setBlockchainRecords(updatedRecords);
                        const updatedIdea = await api.getIdeaById(ideaId);
                        setIdea(updatedIdea);
                        clearInterval(intervalId);
                    }
                }, 3000);
            }
        };

        startFetching();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [ideaId, fetchIdeaData]);
    
    const fetchRecommendations = useCallback(async () => {
        setIsRecsLoading(true);
        const recommendations = await api.getRecommendedCollaborators(ideaId);
        setRecommendedCollaborators(recommendations);
        setIsRecsLoading(false);
    }, [ideaId]);

    const handleRequestSubmit = async (formData: { skills: string, contribution: string, motivation: string }) => {
        if (!idea || !currentUser) return;
        await api.submitCollaborationRequest({ ideaId: idea.ideaId, requesterId: currentUser.userId, ...formData });
        setCollaborationModalOpen(false);
        alert('Your collaboration request has been sent!');
        fetchIdeaData(false); 
    };
    
    const handleUpdateRequestStatus = async (requestId: string, status: 'approved' | 'denied') => {
        const { unlockedAchievements } = await api.updateCollaborationRequestStatus(requestId, status);
        onAchievementsUnlock(unlockedAchievements);
        fetchIdeaData(false);
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGuest) {
            onGuestAction();
            return;
        }
        if (!newComment.trim() || !idea || !currentUser) return;
        setIsPostingComment(true);
        const postedComment = await api.postComment(idea.ideaId, currentUser.userId, newComment);
        setComments(prev => [...prev, postedComment]);
        setIdea(prev => prev ? ({ ...prev, commentsCount: prev.commentsCount + 1 }) : null);
        setNewComment('');
        setIsPostingComment(false);
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (isGuest) {
            onGuestAction();
            return;
        }
        if (!idea || !currentUser) return;
        const updatedIdea = await api.castVote(idea.ideaId, currentUser.userId, type);
        if (updatedIdea) {
            setIdea(updatedIdea);
        }
    };

    const handleFeedbackSubmit = (newFeedback: Feedback, unlockedAchievements: AchievementId[]) => {
        setFeedbackList(prev => [newFeedback, ...prev]);
        setFeedbackModalOpen(false);
        onAchievementsUnlock(unlockedAchievements);
    };
    
    const handleUpdateProgress = async (newStage: ProgressStage) => {
        if (!idea) return;
        const updatedIdea = await api.updateIdeaProgressStage(idea.ideaId, newStage);
        if (updatedIdea) {
            setIdea(updatedIdea);
        }
    };

    const handleReportSubmit = async (reason: any, details: string) => {
        if (!reportingContent || !currentUser) return;
        await api.submitReport({
            contentType: reportingContent.type,
            contentId: reportingContent.id,
            reporterId: currentUser.userId,
            reason,
            details,
        });
        setReportingContent(null);
        alert('Thank you for your report. Our team will review this shortly.');
        fetchIdeaData(false); // Refetch to show "under review" status
    };

    const handleSaveMilestone = async (data: Omit<Milestone, 'id' | 'status' | 'completedAt'>) => {
        if (editingMilestone) {
            await api.editMilestone(ideaId, editingMilestone.id, data);
        } else {
            await api.addMilestone(ideaId, data);
        }
        fetchIdeaData(false);
        setShowMilestoneForm(false);
        setEditingMilestone(null);
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        if (window.confirm('Are you sure you want to delete this milestone?')) {
            await api.deleteMilestone(ideaId, milestoneId);
            fetchIdeaData(false);
        }
    };

    const handleCompleteMilestone = async (milestoneId: string) => {
        await api.completeMilestone(ideaId, milestoneId);
        fetchIdeaData(false);
        alert('Milestone completed! A success story has been posted to the feed.');
    };


    const { upvotes, downvotes, userVote } = useMemo(() => {
        if (!idea) return { upvotes: 0, downvotes: 0, userVote: null };
        return {
            upvotes: idea.votes.filter(v => v.type === 'up').length,
            downvotes: idea.votes.filter(v => v.type === 'down').length,
            userVote: idea.votes.find(v => v.userId === currentUser?.userId)?.type || null
        }
    }, [idea, currentUser]);

    if (isLoading) return <div className="text-center p-8">Loading idea details...</div>;
    if (!idea || !owner) return <div className="text-center p-8">Idea not found.</div>;

    const isOwner = currentUser?.userId === idea.ownerId;
    const isCollaborator = idea.collaborators.includes(currentUser?.userId || '');
    const userRequest = currentUser ? requests.find(r => r.requesterId === currentUser.userId) : null;
    const hasPendingRequest = userRequest?.status === 'pending';
    const hasGivenFeedback = currentUser ? feedbackList.some(f => f.userId === currentUser.userId) : false;

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
        
        let buttonText = "Collaborate";
        let isDisabled = false;
        if(isCollaborator) { buttonText = "You are a Collaborator"; isDisabled = true; } 
        else if (hasPendingRequest) { buttonText = "Request Pending"; isDisabled = true; }
        
        return (
            <button 
                onClick={() => setCollaborationModalOpen(true)}
                disabled={isDisabled}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        );
    }
    
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const canAccessForum = isOwner || isCollaborator;
    const showProjectBoard = idea.progressStage === 'in-development' || idea.progressStage === 'launched';
    const sortedRoadmap = [...idea.roadmap].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());


    return (
        <>
            {collaborationModalOpen && currentUser && <CollaborationRequestModal idea={idea} onClose={() => setCollaborationModalOpen(false)} onSubmit={handleRequestSubmit} />}
            {feedbackModalOpen && currentUser && <FeedbackModal idea={idea} currentUser={currentUser} onClose={() => setFeedbackModalOpen(false)} onSubmit={handleFeedbackSubmit} />}
            {reportingContent && (
                <ReportModal
                    contentId={reportingContent.id}
                    contentType={reportingContent.type}
                    contentTitle={reportingContent.title}
                    currentUser={currentUser!}
                    onClose={() => setReportingContent(null)}
                    onSubmit={handleReportSubmit}
                />
            )}
             {showMilestoneForm && (
                <MilestoneFormModal
                    milestone={editingMilestone}
                    onClose={() => { setShowMilestoneForm(false); setEditingMilestone(null); }}
                    onSave={handleSaveMilestone}
                />
            )}
            
            <div className="container mx-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                     {idea.isUnderReview && (
                        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 text-sm p-4 rounded-lg mb-6 flex items-start space-x-3">
                            <AlertTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Content Under Review</h4>
                                <p>This idea has been reported for a potential violation of our community guidelines. Our moderation team is currently reviewing it.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                        <button onClick={() => setPage('feed')} className="text-indigo-400 mb-4">&larr; Back to Feed</button>
                         <div className="relative">
                            <button onClick={() => isGuest ? onGuestAction() : setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-white/10">
                                <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
                            </button>
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row items-start gap-x-6">
                        <div className="flex flex-col items-center space-y-2 mt-2">
                            <button
                                onClick={() => handleVote('up')}
                                className={`p-2 rounded-full transition-colors ${userVote === 'up' ? 'bg-indigo-600 text-white' : 'bg-[#252532] hover:bg-[#374151]'}`}
                                aria-label="Upvote"
                            >
                                <ArrowUpIcon className="w-6 h-6"/>
                            </button>
                            <span className="font-bold text-xl text-white">{upvotes - downvotes}</span>
                            <button
                                onClick={() => handleVote('down')}
                                className={`p-2 rounded-full transition-colors ${userVote === 'down' ? 'bg-red-600 text-white' : 'bg-[#252532] hover:bg-[#374151]'}`}
                                aria-label="Downvote"
                            >
                                <ArrowDownIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-white mb-6">{idea.title}</h1>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h2 className="text-xl font-semibold text-white mb-2">Summary</h2>
                                        <p className="text-gray-300">{idea.summary}</p>
                                    </div>
                                    
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h2 className="text-xl font-semibold text-white mb-4">Ideation Details</h2>
                                        <div className="space-y-4">
                                            <div><h3 className="font-semibold text-indigo-300">Problem Statement</h3><p className="text-gray-300">{idea.questionnaire.problemStatement}</p></div>
                                            <div><h3 className="font-semibold text-indigo-300">Target Audience</h3><p className="text-gray-300">{idea.questionnaire.targetAudience}</p></div>
                                            <div><h3 className="font-semibold text-indigo-300">Resources Needed</h3><p className="text-gray-300">{idea.questionnaire.resourcesNeeded}</p></div>
                                        </div>
                                    </div>
                                    {/* Project Roadmap Section */}
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                                                <RocketIcon className="w-6 h-6 text-cyan-400" />
                                                <span>Project Roadmap</span>
                                            </h2>
                                            {isOwner && (
                                                <button onClick={() => { setEditingMilestone(null); setShowMilestoneForm(true); }} className="flex items-center space-x-2 bg-[#252532] hover:bg-[#374151] px-3 py-1.5 text-sm rounded-lg">
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
                                                                    {m.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-500" />}
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
                                                                        <button onClick={() => { setEditingMilestone(m); setShowMilestoneForm(true); }} className="p-1.5 hover:bg-white/10 rounded-md"><Edit3Icon className="w-4 h-4 text-gray-400"/></button>
                                                                        <button onClick={() => handleDeleteMilestone(m.id)} className="p-1.5 hover:bg-white/10 rounded-md"><TrashIcon className="w-4 h-4 text-gray-400"/></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isOwner && m.status === 'pending' && (
                                                            <div className="pl-8 pt-3 mt-3 border-t border-white/10">
                                                                <button onClick={() => handleCompleteMilestone(m.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1">
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
                                                    Feedback <span className="bg-[#252532] text-xs px-2 py-0.5 rounded-full">{feedbackList.length}</span>
                                                </button>
                                                <button role="tab" id="comments-tab" aria-controls="comments-panel" aria-selected={activeTab === 'comments'} onClick={() => setActiveTab('comments')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'}`}>
                                                    Comments <span className="bg-[#252532] text-xs px-2 py-0.5 rounded-full">{idea.commentsCount}</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div id="feedback-panel" role="tabpanel" tabIndex={0} aria-labelledby="feedback-tab" hidden={activeTab !== 'feedback'}>
                                            <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                                {feedbackList.length > 0 ? (
                                                    <div className="space-y-2 divide-y divide-white/10">
                                                        {feedbackList.map(fb => <FeedbackCard key={fb.feedbackId} feedback={fb} />)}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 py-4 text-center">No feedback yet. Be the first to provide a review!</p>
                                                )}
                                            </div>
                                        </div>

                                        <div id="comments-panel" role="tabpanel" tabIndex={0} aria-labelledby="comments-tab" hidden={activeTab !== 'comments'}>
                                            <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                                <div className="space-y-2 divide-y divide-white/10">
                                                    {comments.length > 0 ? (
                                                        comments.map(comment => <CommentCard key={comment.commentId} comment={comment} onReport={(id) => setReportingContent({ type: 'comment', id, title: 'a comment' })} isGuest={isGuest} onGuestAction={onGuestAction} />)
                                                    ) : (
                                                        <p className="text-gray-500 py-4">Be the first to comment.</p>
                                                    )}
                                                </div>
                                                <form onSubmit={handlePostComment} className="mt-6 flex items-start space-x-3">
                                                    {currentUser && <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full" />}
                                                    <div className="flex-1">
                                                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a public comment..." rows={2} className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                                        <div className="flex justify-end mt-2">
                                                            <button type="submit" disabled={isPostingComment || !newComment.trim()} className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                                                {isPostingComment ? 'Posting...' : 'Post Comment'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Project Status</h3>
                                        <ProgressTracker currentStageId={idea.progressStage} isOwner={isOwner} onUpdate={handleUpdateProgress} />
                                    </div>

                                    <div className="space-y-4">
                                        {renderActionButton()}
                                         {!isOwner && !isGuest && (
                                            <button
                                                onClick={() => setFeedbackModalOpen(true)}
                                                disabled={hasGivenFeedback}
                                                className="w-full bg-[#374151] text-white px-6 py-3 rounded-lg hover:bg-[#4b5563] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                            >
                                                <StarIcon className="w-5 h-5" />
                                                <span>{hasGivenFeedback ? "Feedback Submitted" : "Provide Feedback"}</span>
                                            </button>
                                        )}
                                        <div className="flex space-x-4">
                                            {(canAccessForum || showProjectBoard) && (
                                                <>
                                                    {canAccessForum && (
                                                        <button onClick={() => setPage('forum', idea.ideaId)} className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2">
                                                            <MessageSquareIcon className="w-5 h-5"/>
                                                            <span>Discussion</span>
                                                        </button>
                                                    )}
                                                    {showProjectBoard && (
                                                        <button onClick={() => setPage('kanban', idea.ideaId)} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2">
                                                            <LayoutTemplateIcon className="w-5 h-5"/>
                                                            <span>Project Board</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button onClick={() => setPage('ideaBoard', idea.ideaId)} className="flex-1 bg-[#374151] text-white px-4 py-2.5 rounded-lg">
                                                View Idea Board
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Blockchain Activity</h3>
                                        {blockchainRecords.length > 0 ? (
                                            <div className="space-y-4">
                                                {blockchainRecords.map(record => (
                                                    <BlockchainRecordCard key={record.recordId} record={record} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-700/30 border border-gray-500/30 rounded-lg p-4 flex items-center space-x-3">
                                                <LoaderIcon className="w-5 h-5 text-indigo-400 animate-spin" />
                                                <p className="text-sm text-gray-400">Waiting for blockchain activity...</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isOwner && pendingRequests.length > 0 && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <h2 className="text-xl font-semibold text-white mb-4">Collaboration Requests ({pendingRequests.length})</h2>
                                            <div className="grid grid-cols-1 gap-4">
                                                {pendingRequests.map(req => (
                                                    <RequestCard key={req.requestId} request={req} onApprove={(id) => handleUpdateRequestStatus(id, 'approved')} onDeny={(id) => handleUpdateRequestStatus(id, 'denied')} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isOwner && (
                                        <div className="bg-[#1A1A24] p-6 rounded-2xl shadow-lg border border-white/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                                                    <CpuIcon className="w-5 h-5 text-indigo-400" />
                                                    <span>AI Recommendations</span>
                                                </h2>
                                                <button onClick={fetchRecommendations} disabled={isRecsLoading} className="p-2 rounded-full bg-[#252532] hover:bg-[#374151] disabled:opacity-50">
                                                    <RefreshCwIcon className={`w-4 h-4 ${isRecsLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                            {isRecsLoading ? (
                                                <div className="text-center py-8">
                                                    <LoaderIcon className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                                                </div>
                                            ) : recommendedCollaborators.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                                    {recommendedCollaborators.slice(0, 2).map(user => (
                                                        <RecommendedUserCard key={user.userId} user={user} setPage={setPage} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-center text-gray-500 py-4">Click refresh to get AI-powered collaborator matches.</p>
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
