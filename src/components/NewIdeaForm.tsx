// C:\Users\hemant\Downloads\synapse\src\components\NewIdeaForm.tsx
import React, { useState } from 'react';
import { User, Page, AchievementId, IdeaTemplate } from '../types';
import { SECTORS, REGIONS, IDEA_TEMPLATES } from '../constants';
import api from '../services/backendApiService';
import * as Icons from './icons';

interface NewIdeaFormProps {
    currentUser: User; // Keep this prop
    setPage: (page: Page, id?: string) => void;
    setSelectedIdeaId: (id: string) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}

const TemplateCard: React.FC<{ template: IdeaTemplate; onSelect: () => void; }> = ({ template, onSelect }) => {
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
                     if (parts.length >= 2) {
                        return <p key={index}><strong className="text-gray-200">{parts[0]}</strong>: {parts.slice(1).join(':**')}</p>;
                     }
                     return <p key={index}>{line.substring(2)}</p>;
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

export const NewIdeaForm: React.FC<NewIdeaFormProps> = ({ currentUser, setPage, setSelectedIdeaId, onAchievementsUnlock }) => { // currentUser is now used
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<IdeaTemplate | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        sector: SECTORS[0],
        region: REGIONS[0],
        problemStatement: '',
        targetAudience: '',
        resourcesNeeded: '',
        timeline: '',
        skillsLooking: '',
        visionForSuccess: '',
        isPublic: true,
    });
    const [isRefining, setIsRefining] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAddTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };
    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        setError(null);
    };

    const handleRefineSummary = async () => {
        if (!formData.summary) {
            setError('Please enter a summary first');
            return;
        }
        setIsRefining(true);
        setError(null);
        try {
            const response = await api.refineSummary({ summary: formData.summary });
            setFormData(prev => ({ ...prev, summary: response.refinedSummary || formData.summary }));
        } catch (err: any) {
            console.error('Refinement failed:', err);
            setError(`Failed to refine summary: ${err.message || 'Please try again.'}`);
        } finally {
            setIsRefining(false);
        }
    };

    const handleValidateIdea = async () => {
        if (!formData.title || !formData.summary) {
            setError('Please fill in title and summary first');
            return;
        }
        setIsValidating(true);
        setValidationResult(null);
        setError(null);
        try {
            const response = await api.analyzeIdea({
                title: formData.title,
                description: formData.summary,
                category: formData.sector
            });

            const analysis = response.analysis;
            if (!analysis) {
                throw new Error("Received empty analysis from backend.");
            }

            const formattedResult = `
### AI Validation Report

**Feasibility:** ${analysis.feasibility?.score ?? 'N/A'}/10 (${analysis.feasibility?.reason ?? 'No reason provided'})
**Innovation:** ${analysis.innovation?.score ?? 'N/A'}/10 (${analysis.innovation?.reason ?? 'No reason provided'})
**Market Potential:** ${analysis.marketPotential?.score ?? 'N/A'}/10 (${analysis.marketPotential?.reason ?? 'No reason provided'})

#### SWOT Analysis (Example based on ai.service.ts):
- **Strengths:** ${(analysis.strengths ?? []).join(', ') || 'None identified'}
- **Weaknesses:** ${(analysis.weaknesses ?? []).join(', ') || 'None identified'}
- **Opportunities:** ${(analysis.opportunities ?? []).join(', ') || 'None identified'}
- **Threats:** ${(analysis.threats ?? []).join(', ') || 'None identified'}

#### Recommendations:
${(analysis.recommendations ?? []).map((rec: string) => `- ${rec}`).join('\n') || 'No specific recommendations.'}

**Est. Dev Time:** ${analysis.estimatedDevelopmentTime || 'Unknown'}
            `.trim();

            setValidationResult(formattedResult);

        } catch (err: any) {
            console.error('Validation failed:', err);
            setError(`Failed to validate idea: ${err.message || 'Please try again.'}`);
        } finally {
            setIsValidating(false);
        }
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
         if (!formData.title.trim() || !formData.summary.trim()) {
             setError('Title and summary are required');
             return;
         }
         setIsSubmitting(true);
         setError(null);
         try {
             const newIdeaData = {
                 // FIX: Use currentUser.userId here
                 ownerId: currentUser.userId,
                 title: formData.title.trim(),
                 description: formData.summary.trim(),
                 tags: tags,
                 category: formData.sector,
                 stage: 'idea',
                 isPublic: formData.isPublic,
                 questionnaire: {
                    problemStatement: formData.problemStatement,
                    targetAudience: formData.targetAudience,
                    resourcesNeeded: formData.resourcesNeeded,
                    timeline: formData.timeline,
                    skillsLooking: formData.skillsLooking,
                    visionForSuccess: formData.visionForSuccess,
                 }
                 // region: formData.region, // Add if backend supports
                 // requiredSkills: [], // Add if backend supports
             };

             const { idea: createdIdea, unlockedAchievements } = await api.addIdea(newIdeaData);

             onAchievementsUnlock(unlockedAchievements || []);
             alert("Your idea has been published!");

             setSelectedIdeaId(createdIdea.ideaId);
             setPage('ideaDetail', createdIdea.ideaId);

         } catch (err: any) {
             console.error('Publish idea failed:', err);
             setError(`Failed to publish idea: ${err.message || 'Please try again.'}`);
         } finally {
             setIsSubmitting(false);
         }
     };


    const nextStep = () => {
        if (step === 2 && (!formData.title.trim() || !formData.summary.trim())) {
            setError('Title and summary are required');
            return;
        }
        setError(null);
        setStep(s => s + 1);
    };
    const prevStep = () => {
        setError(null);
        setStep(s => s - 1);
    };
    const totalSteps = 4;

    const inputBaseClass = "mt-1 block w-full bg-[#252532] border-2 border-[#374151] rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    const textAreaClass = `${inputBaseClass} min-h-[80px]`;

    const defaultPrompts = {
        problemStatement: 'What specific problem does this idea solve?',
        targetAudience: 'Who is the primary target audience or user group?',
        resourcesNeeded: 'What key resources (skills, funding, tech) are needed for an MVP?',
        timeline: 'What is a rough timeline for the initial phase (e.g., 3-6 months)?',
        skillsLooking: 'What skills are crucial for collaborators?',
        visionForSuccess: 'What does success look like in 1-3 years?',
    };
    const prompts = selectedTemplate?.questionnairePrompts || defaultPrompts;


    const renderStep = () => {
        switch (step) {
            case 1: // Template Selection
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-2xl font-semibold text-white text-center">Step 1: Choose a Template</h2>
                        <p className="text-center text-gray-400">Select a template to guide your ideation, or start fresh.</p>
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
            case 2: // Basic Information
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 2: Core Idea Details</h2>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Idea Title *</label>
                            <input id="title" type="text" name="title" value={formData.title} onChange={handleInputChange} className={inputBaseClass} placeholder="Enter a compelling title" />
                        </div>
                        <div>
                            <label htmlFor="summary" className="block text-sm font-medium text-gray-300">Summary / Description *</label>
                            <textarea id="summary" name="summary" value={formData.summary} onChange={handleInputChange} rows={4} className={textAreaClass} placeholder="Describe your idea clearly..."></textarea>
                             <button type="button" onClick={handleRefineSummary} disabled={isRefining || !formData.summary.trim()} className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1A1A24] disabled:opacity-50 transition-transform active:scale-95">
                                <Icons.SparklesIcon className="w-4 h-4 mr-1"/>
                                {isRefining ? 'Refining...' : 'Refine with AI'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="tags-input" className="block text-sm font-medium text-gray-300">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                                {tags.map((tag) => (
                                    <div key={tag} className="flex items-center space-x-1 bg-indigo-900/30 text-indigo-200 px-2.5 py-0.5 rounded-full text-sm">
                                        <span>{tag}</span>
                                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-indigo-400 hover:text-indigo-200">&times;</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input id="tags-input" type="text" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyPress={handleKeyPress} placeholder="Add relevant tags (e.g., AI, HealthTech)" className={`${inputBaseClass} flex-1`} />
                                <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm">Add Tag</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="sector" className="block text-sm font-medium text-gray-300">Primary Sector/Category</label>
                            <select id="sector" name="sector" value={formData.sector} onChange={handleInputChange} className={inputBaseClass}>
                                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                           <input type="checkbox" id="isPublic" name="isPublic" checked={formData.isPublic} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500" />
                           <label htmlFor="isPublic" className="text-sm text-gray-300">Make this idea public</label>
                        </div>
                    </div>
                );
            case 3: // Guided Questionnaire
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 3: Deeper Dive {selectedTemplate ? `(${selectedTemplate.name})` : ''}</h2>
                        <p className="text-sm text-gray-400 -mt-4">Answer these questions to flesh out your idea.</p>
                        <div><label htmlFor="problemStatement" className="block text-sm font-medium text-gray-300">{prompts.problemStatement}</label><textarea id="problemStatement" name="problemStatement" value={formData.problemStatement} onChange={handleInputChange} rows={3} className={textAreaClass}></textarea></div>
                        <div><label htmlFor="targetAudience" className="block text-sm font-medium text-gray-300">{prompts.targetAudience}</label><textarea id="targetAudience" name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} rows={3} className={textAreaClass}></textarea></div>
                        <div><label htmlFor="resourcesNeeded" className="block text-sm font-medium text-gray-300">{prompts.resourcesNeeded}</label><textarea id="resourcesNeeded" name="resourcesNeeded" value={formData.resourcesNeeded} onChange={handleInputChange} rows={3} className={textAreaClass}></textarea></div>
                        <div><label htmlFor="timeline" className="block text-sm font-medium text-gray-300">{prompts.timeline}</label><input id="timeline" type="text" name="timeline" value={formData.timeline} onChange={handleInputChange} className={inputBaseClass} /></div>
                        <div><label htmlFor="skillsLooking" className="block text-sm font-medium text-gray-300">{prompts.skillsLooking}</label><input id="skillsLooking" type="text" name="skillsLooking" value={formData.skillsLooking} onChange={handleInputChange} className={inputBaseClass} /></div>
                        <div><label htmlFor="visionForSuccess" className="block text-sm font-medium text-gray-300">{prompts.visionForSuccess}</label><textarea id="visionForSuccess" name="visionForSuccess" value={formData.visionForSuccess} onChange={handleInputChange} rows={3} className={textAreaClass}></textarea></div>
                    </div>
                );
            case 4: // AI Validation & Publish
                return (
                    <div className="space-y-6 animate-fadeInUp">
                        <h2 className="text-xl font-semibold text-white">Step 4: AI Validation & Final Review</h2>
                        <p className="text-sm text-gray-400 -mt-4">Optionally, get instant AI feedback before publishing.</p>
                        <div className="text-center pt-2">
                            <button type="button" onClick={handleValidateIdea} disabled={isValidating || !formData.title.trim() || !formData.summary.trim()} className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 transition-transform active:scale-95">
                                <Icons.CpuIcon className="w-5 h-5 mr-2"/>
                                {isValidating ? 'Analyzing...' : 'Validate with AI'}
                            </button>
                        </div>
                        {isValidating && (
                            <div className="text-center py-4">
                                <Icons.LoaderIcon className="w-6 h-6 animate-spin mx-auto text-indigo-400"/>
                                <p className="text-gray-400 mt-2 text-sm">AI analyzing feasibility, market fit, and innovation...</p>
                            </div>
                        )}
                        {validationResult && (
                            <div className="bg-black/20 p-5 rounded-lg border border-white/10 mt-4">
                                <h3 className="text-lg font-bold text-white mb-3 text-center">AI Validation Report</h3>
                                <MarkdownRenderer content={validationResult} />
                            </div>
                        )}
                        <p className="text-center text-gray-400 pt-4">Ready to share your vision?</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl animate-fadeInUp">
            <div className="bg-[#1A1A24]/70 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-white/10">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white text-center">Share Your New Idea</h1>
                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}
                {step > 1 && (
                    <div className="mb-8">
                        <div className="w-full bg-[#252532] rounded-full h-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
                        </div>
                        <ol className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                            <li className={`w-1/3 text-center ${step >= 2 ? 'text-indigo-400 font-medium' : ''}`}>Details</li>
                            <li className={`w-1/3 text-center ${step >= 3 ? 'text-indigo-400 font-medium' : ''}`}>Questions</li>
                            <li className={`w-1/3 text-center ${step >= 4 ? 'text-indigo-400 font-medium' : ''}`}>Publish</li>
                        </ol>
                    </div>
                )}
                {renderStep()}
                <div className="mt-8 flex justify-between items-center">
                    {step > 1 ? (
                        <button onClick={prevStep} className="bg-[#374151] text-white px-5 py-2 rounded-lg hover:bg-[#4b5563] transition-colors text-sm font-medium">Back</button>
                    ) : (
                        <div className="w-20"></div>
                    )}
                    {step < totalSteps ?
                        (step > 1 &&
                            <button onClick={nextStep} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm font-medium">Next</button>
                        )
                        : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.title.trim() || !formData.summary.trim()}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-semibold"
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish Idea'}
                            </button>
                        )
                    }
                    {step === 1 && <div className="w-20"></div>}
                </div>
            </div>
        </div>
    );
};