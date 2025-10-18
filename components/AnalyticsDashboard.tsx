import React, { useState, useEffect } from 'react';
import { Idea, User, Page, IdeaAnalytics } from '../types';
import { api } from '../services/mockApiService';
import { LoaderIcon, EyeIcon, TrendingUpIcon, UsersIcon, BarChartIcon, MapPinIcon } from './icons';

// --- SUB-COMPONENTS for the Dashboard ---

const StatCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: string | number;
    colorClass: string;
}> = ({ icon: Icon, title, value, colorClass }) => (
    <div className="bg-[#1A1A24]/70 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[#1A1A24]/70 backdrop-blur-md p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <div className="h-64">
            {children}
        </div>
    </div>
);

const LineChart: React.FC<{ data: { date: string; views: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-gray-500 flex items-center justify-center h-full">No data available.</p>;
    const maxValue = Math.max(...data.map(d => d.views), 1); // Avoid division by zero
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.views / maxValue) * 100}`).join(' ');

    return (
        <div className="w-full h-full flex flex-col">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="flex-1">
                <defs>
                    <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon fill="url(#lineChartGradient)" points={`0,100 ${points} 100,100`} />
                <polyline fill="none" stroke="#8B5CF6" strokeWidth="2" points={points} />
            </svg>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-gray-500 flex items-center justify-center h-full">No data available.</p>;
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    return (
        <div className="w-full h-full flex items-end justify-around space-x-2">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md"
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                        title={`${item.label}: ${item.value}`}
                    />
                    <span className="text-xs text-gray-400 mt-1 truncate">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const DonutChart: React.FC<{ data: { skill: string; count: number }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return <p className="text-gray-500 flex items-center justify-center h-full">No collaborator data yet.</p>;

    const colors = ['#6366F1', '#8B5CF6', '#A78BFA', '#38BDF8', '#22D3EE'];
    let cumulative = 0;

    return (
        <div className="w-full h-full flex items-center space-x-6">
            <div className="w-1/2 h-full relative">
                 <svg viewBox="0 0 36 36" className="w-full h-full">
                    {data.map((item, index) => {
                        const percentage = (item.count / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = 25 - cumulative;
                        cumulative += percentage;
                        return (
                             <circle
                                key={item.skill}
                                cx="18"
                                cy="18"
                                r="15.9"
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth="4"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 18 18)"
                            />
                        )
                    })}
                 </svg>
            </div>
            <div className="w-1/2 space-y-2">
                {data.map((item, index) => (
                    <div key={item.skill} className="flex items-center text-sm">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}/>
                        <span className="text-gray-300">{item.skill}</span>
                        <span className="ml-auto text-gray-400 font-mono">{((item.count/total)*100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface AnalyticsDashboardProps {
    ideaId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ ideaId, currentUser, setPage }) => {
    const [idea, setIdea] = useState<Idea | null>(null);
    const [analytics, setAnalytics] = useState<IdeaAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [ideaData, analyticsData] = await Promise.all([
                api.getIdeaById(ideaId),
                api.getAnalyticsForIdea(ideaId),
            ]);

            if (ideaData && ideaData.ownerId !== currentUser.userId) {
                alert("You don't have permission to view these analytics.");
                setPage('ideaDetail', ideaId);
                return;
            }

            setIdea(ideaData);
            setAnalytics(analyticsData);
            setIsLoading(false);
        };
        fetchData();
    }, [ideaId, currentUser.userId, setPage]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><LoaderIcon className="w-8 h-8 animate-spin" /></div>;
    }
    if (!idea || !analytics) {
        return <div className="text-center p-8">Could not load analytics data.</div>;
    }

    return (
        <div className="bg-[#0A0A0F] min-h-screen p-4 md:p-8 animate-fadeInUp">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => setPage('ideaDetail', ideaId)} className="text-indigo-400 mb-6">&larr; Back to Idea</button>
                <div className="flex items-center space-x-3 mb-6">
                    <BarChartIcon className="w-8 h-8 text-indigo-400"/>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                        <p className="text-gray-400">{idea.title}</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={EyeIcon} title="Total Views" value={analytics.totalViews.toLocaleString()} colorClass="bg-blue-500" />
                    <StatCard icon={TrendingUpIcon} title="Engagement Rate" value={`${analytics.engagementRate.toFixed(1)}%`} colorClass="bg-emerald-500" />
                    <StatCard icon={UsersIcon} title="Collaborators" value={idea.collaborators.length} colorClass="bg-purple-500" />
                    <StatCard icon={MapPinIcon} title="Conversion Rate" value={`${analytics.collaborationConversionRate.toFixed(1)}%`} colorClass="bg-orange-500" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartContainer title="Views Over Time (Last 7 Days)">
                        <LineChart data={analytics.viewsOverTime} />
                    </ChartContainer>

                    <ChartContainer title="Collaborator Skills">
                        <DonutChart data={analytics.collaboratorSkillDemographics} />
                    </ChartContainer>

                    <ChartContainer title="Top 5 Regions by Views">
                         <BarChart data={analytics.geography.slice(0, 5).map(g => ({ label: g.region, value: g.views }))} />
                    </ChartContainer>

                    <ChartContainer title="Traffic Sources">
                        <BarChart data={analytics.trafficSources.map(s => ({ label: s.source, value: s.visits }))} />
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};