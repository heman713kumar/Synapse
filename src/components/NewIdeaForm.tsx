
import React, { useState } from 'react';
import { User, Page, Idea, AchievementId, IdeaTemplate } from '../types';
import { SECTORS, REGIONS, SKILLS, IDEA_TEMPLATES } from '../constants';
import { api } from '../services/mockApiService';
import { refineTextWithGemini, validateIdeaWithGemini } from '../services/geminiService';
import * as Icons from './icons';

interface NewIdeaFormProps {
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
    setSelectedIdeaId: (id: string) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}

const TemplateCard: React.FC<{
    template: IdeaTemplate;
    onSelect: () => void;
}> = ({ template, onSelect }) => {
    const Icon = Icons[template.icon];
    return (
        <button onClick={onSelect} className="bg-[#252532] p-6 rounded-2xl border-2 border-transparent hover:border-indigo-500 text-left w-full h-full flex flex-col transition-all duration-200 transform hover:-translate-y-1">
            <Icon className="w-8 h-8 text-indigo-400 mb-3" />
            <h3 className="font-bold text-lg text-white">{template.name}</h3>
            <p className="text-sm text-gray-400 mt-1 flex-grow">{template.description}</p>
        </button>
    );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-indigo-400 max-w-none space-y-2 text-left">
            {lines.map((line, index) => {
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-semibold text-indigo-300 pt-2">{line.substring(4)}</h3>;
                }
                if (line.startsWith('- **')) {
                    const parts = line.substring(2).split(':**');
                    return <p key={index}><strong className="text-gray-200">{parts[0]}</strong>: {parts[1]}</p>;
                }
                if (line.startsWith('- ')) {
                    return <p key={index} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-400">{line.substring(2)}</p>;
                }
                if (line.includes('**')) {
                     const parts = line.split('**');
                    return (
                        <p key={index}>
                            {parts.map((part, i) =>
                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                        </p>
                    );
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};


export const NewIdeaForm: React.FC<NewIdeaFormProps> = ({ currentUser, setPage, setSelectedIdeaId, onAchievementsUnlock }) => {
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<IdeaTemplate | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        tags: [] as string[],
        sector: SECTORS[0],
        region: REGIONS[0],
        requiredSkills: [] as string[],
        problemStatement: '',
        targetAudience: '',
        resourcesNeeded: '',
        timeline: '',
        skillsLooking: '',
        visionForSuccess: '',
        isPublic: false,
    });
    const [isRefining, setIsRefining] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, options } = e.target;
        const value: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleRefineSummary = async () => {
        if (!formData.summary) return;
        setIsRefining(true);
        const refinedSummary = await refineTextWithGemini(formData.summary);
        setFormData(prev => ({ ...prev, summary: refinedSummary }));
        setIsRefining(false);
    };
    
    const handleValidateIdea = async () => {
        setIsValidating(true);
        setValidationResult(null);
        const result = await validateIdeaWithGemini({
            title: formData.title,
            summary: formData.summary,
            questionnaire: {
                problemStatement: formData.problemStatement,
                targetAudience: formData.targetAudience,
                resourcesNeeded: formData.resourcesNeeded,
                timeline: formData.timeline,
                skillsLooking: formData.skillsLooking,
                visionForSuccess: formData.visionForSuccess,
            }
        });
        setValidationResult(result);
        setIsValidating(false);
    };

    const handleSelectTemplate = (template: IdeaTemplate | null) => {
        setSelectedTemplate(template);
        setFormData(prev => ({
            ...prev,
            problemStatement: '', targetAudience: '', resourcesNeeded: '',
            timeline: '', skillsLooking: '', visionForSuccess: '',
        }));
        setStep(2);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const newIdeaData: Omit<Idea, 'ideaId' | 'createdAt' | 'likesCount' | 'commentsCount' | 'collaborators' | 'forumMembers' | 'blockchainHash' | 'blockchainTimestamp' | 'votes' | 'progressStage' | 'roadmap'> = {
            ownerId: currentUser.userId,
            title: formData.title,
            summary: formData.summary,
            tags: formData.tags,
            sector: formData.sector,
            region: formData.region,
            requiredSkills: formData.requiredSkills,
            questionnaire: {
                problemStatement: formData.problemStatement,
                targetAudience: formData.targetAudience,
                resourcesNeeded: formData.resourcesNeeded,
                timeline: formData.timeline,
                skillsLooking: formData.skillsLooking,
                visionForSuccess: formData.visionForSuccess,
            },
            ideaBoard: { nodes: [], isPublic: formData.isPublic },
            status: 'active'
        };
        
        const { idea: createdIdea, unlockedAchievements } = await api.addIdea(newIdeaData);
        
        onAchievementsUnlock(unlockedAchievements);
        alert("Your idea has been published! You'll receive a notification once it's timestamped on the blockchain.");
        
        setSelectedIdeaId(createdIdea.ideaId);
        setPage('ideaDetail', createdIdea.ideaId);
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    const totalSteps = 4;

    const inputBaseClass = "mt-1 block w-full bg-[#252532] border-2 border-[#374151] rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";

    const defaultPrompts = {
        problemStatement: 'What problem does this idea solve?',
        targetAudience: 'Who is the target audience/users?',
        resourcesNeeded: 'What resources do you need?',
        timeline: 'What is your expected timeline?',
        skillsLooking: 'What specific skills are you looking for?',
        visionForSuccess: 'What is your vision for success?',
    };
    const prompts = selectedTemplate?.questionnairePrompts || defaultPrompts;


    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                     <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-2xl font-semibold text-white text-center">Step 1: Choose a Template</h2>
                        <p className="text-center text-gray-400">Select a template to guide your ideation process, or start from scratch.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                           {IDEA_TEMPLATES.map(template => (
                               <TemplateCard key={template.id} template={template} onSelect={() => handleSelectTemplate(template)} />
                           ))}
                        </div>
                        <div className="text-center pt-4">
                            <button onClick={() => handleSelectTemplate(null)} className="text-indigo-400 hover:text-indigo-300 font-semibold p-2">
                                Or start with a Blank Canvas &rarr;
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 2: Basic Information</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Idea Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={inputBaseClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Summary</label>
                            <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows={4} className={inputBaseClass}></textarea>
                             <button onClick={handleRefineSummary} disabled={isRefining} className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1A1A24] disabled:bg-indigo-400 disabled:cursor-not-allowed transition-transform active:scale-95">
                                <Icons.SparklesIcon className="w-4 h-4 mr-2"/>
                                {isRefining ? 'Refining...' : 'Refine with AI'}
                            </button>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300">Tags (select multiple)</label>
                            <select name="tags" multiple value={formData.tags} onChange={handleMultiSelectChange} className={`${inputBaseClass} h-32 scrollbar-thin`}>
                                {[...SKILLS, ...SECTORS, ...REGIONS].filter((v, i, a) => a.indexOf(v) === i).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Sector</label>
                            <select name="sector" value={formData.sector} onChange={handleInputChange} className={inputBaseClass}>
                                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 3: Guided Ideation Questionnaire</h2>
                        <p className="text-sm text-gray-400 -mt-4">Using the "{selectedTemplate?.name || 'Blank Canvas'}" template.</p>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.problemStatement}</label><textarea name="problemStatement" value={formData.problemStatement} onChange={handleInputChange} className={inputBaseClass}></textarea></div>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.targetAudience}</label><textarea name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} className={inputBaseClass}></textarea></div>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.resourcesNeeded}</label><textarea name="resourcesNeeded" value={formData.resourcesNeeded} onChange={handleInputChange} className={inputBaseClass}></textarea></div>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.timeline}</label><input type="text" name="timeline" value={formData.timeline} onChange={handleInputChange} className={inputBaseClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.skillsLooking}</label><input type="text" name="skillsLooking" value={formData.skillsLooking} onChange={handleInputChange} className={inputBaseClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-300">{prompts.visionForSuccess}</label><textarea name="visionForSuccess" value={formData.visionForSuccess} onChange={handleInputChange} className={inputBaseClass}></textarea></div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 4: AI Validation & Publish</h2>
                        <p className="text-sm text-gray-400 -mt-4">Optionally, get instant AI-powered feedback on your idea before publishing.</p>
                        
                        <div className="text-center">
                            <button onClick={handleValidateIdea} disabled={isValidating} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 transition-transform active:scale-95">
                                <Icons.CpuIcon className="w-5 h-5 mr-2"/>
                                {isValidating ? 'Analyzing...' : 'Validate with AI'}
                            </button>
                        </div>

                        {isValidating && (
                            <div className="text-center">
                                <Icons.LoaderIcon className="w-8 h-8 animate-spin mx-auto text-indigo-400"/>
                                <p className="text-gray-400 mt-2">The AI is analyzing market data... this may take a moment.</p>
                            </div>
                        )}
                        
                        {validationResult && (
                            <div className="bg-black/20 p-6 rounded-lg border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4 text-center">AI Validation Report</h3>
                                <MarkdownRenderer content={validationResult} />
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="container mx-auto p-8 max-w-3xl animate-fadeInUp">
            <div className="bg-[#1A1A24]/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10">
                <h1 className="text-2xl font-bold mb-6 text-white">Post a New Idea</h1>
                <div className="mb-8">
                    <div className="w-full bg-[#252532] rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
                    </div>
                    <ol className="flex justify-between text-sm text-gray-500 mt-2">
                        <li className={step >= 1 ? 'text-indigo-400' : ''}>Template</li>
                        <li className={step >= 2 ? 'text-indigo-400' : ''}>Details</li>
                        <li className={step >= 3 ? 'text-indigo-400' : ''}>Questionnaire</li>
                        <li className={step >= 4 ? 'text-indigo-400' : ''}>Validate & Publish</li>
                    </ol>
                </div>
                {renderStep()}
                {step > 1 && (
                    <div className="mt-8 flex justify-between">
                        <button onClick={prevStep} className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563]">Back</button>
                        {step < totalSteps ? 
                            <button onClick={nextStep} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90">Next</button> :
                            <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Publishing...' : 'Publish Idea'}
                            </button>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};
