import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { User, Page, AchievementId } from './types';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { BottomNavBar } from './components/BottomNavBar';
import { AchievementUnlockedModal } from './components/AchievementUnlockedModal';
import { LoginPromptModal } from './components/LoginPromptModal';
import api from './services/backendApiService';
// Lazy-load heavier/seldom-used pages to keep initial bundle small.
const Profile = lazy(() => import('./components/Profile').then((m) => ({ default: m.Profile })));
const IdeaDetail = lazy(() => import('./components/IdeaDetail').then((m) => ({ default: m.IdeaDetail })));
const NewIdeaForm = lazy(() => import('./components/NewIdeaForm').then((m) => ({ default: m.NewIdeaForm })));
const IdeaBoard = lazy(() => import('./components/IdeaBoard').then((m) => ({ default: m.IdeaBoard })));
const Onboarding = lazy(() => import('./components/Onboarding').then((m) => ({ default: m.Onboarding })));
const Connections = lazy(() => import('./components/Connections').then((m) => ({ default: m.Connections })));
const Bookmarks = lazy(() => import('./components/Bookmarks').then((m) => ({ default: m.Bookmarks })));
const Inbox = lazy(() => import('./components/Inbox').then((m) => ({ default: m.Inbox })));
const Chat = lazy(() => import('./components/Chat').then((m) => ({ default: m.Chat })));
const DiscussionForum = lazy(() => import('./components/DiscussionForum').then((m) => ({ default: m.DiscussionForum })));
const Explore = lazy(() => import('./components/Explore').then((m) => ({ default: m.Explore })));
const NotificationsPage = lazy(() => import('./components/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const VerifyEmail = lazy(() => import('./components/VerifyEmail').then((m) => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
const NotificationSettings = lazy(() => import('./components/NotificationSettings').then((m) => ({ default: m.NotificationSettings })));
const KanbanBoard = lazy(() => import('./components/KanbanBoard').then((m) => ({ default: m.KanbanBoard })));
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch'));
const TrendingAndRecommendations = lazy(() => import('./components/TrendingAndRecommendations'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const Leaderboard = lazy(() => import('./components/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./components/Achievements').then((m) => ({ default: m.Achievements })));
const Drafts = lazy(() => import('./components/Drafts').then((m) => ({ default: m.Drafts })));
const TagPage = lazy(() => import('./components/TagPage').then((m) => ({ default: m.TagPage })));
const Spaces = lazy(() => import('./components/Spaces').then((m) => ({ default: m.Spaces })));
const Events = lazy(() => import('./components/Events').then((m) => ({ default: m.Events })));
const Premium = lazy(() => import('./components/Premium').then((m) => ({ default: m.Premium })));
const InvestorMode = lazy(() => import('./components/InvestorMode').then((m) => ({ default: m.InvestorMode })));
const ActivityTimeline = lazy(() => import('./components/ActivityTimeline').then((m) => ({ default: m.ActivityTimeline })));
const Quests = lazy(() => import('./components/Quests').then((m) => ({ default: m.Quests })));
const Mentorship = lazy(() => import('./components/Mentorship').then((m) => ({ default: m.Mentorship })));
const DeveloperSettings = lazy(() => import('./components/DeveloperSettings').then((m) => ({ default: m.DeveloperSettings })));
const Bounties = lazy(() => import('./components/Bounties').then((m) => ({ default: m.Bounties })));
const JobBoard = lazy(() => import('./components/JobBoard').then((m) => ({ default: m.JobBoard })));
const CompareIdeas = lazy(() => import('./components/CompareIdeas').then((m) => ({ default: m.CompareIdeas })));
const TrendingTags = lazy(() => import('./components/TrendingTags').then((m) => ({ default: m.TrendingTags })));
const StatusPage = lazy(() => import('./components/StatusPage').then((m) => ({ default: m.StatusPage })));
const Changelog = lazy(() => import('./components/Changelog').then((m) => ({ default: m.Changelog })));
const PublicStats = lazy(() => import('./components/PublicStats').then((m) => ({ default: m.PublicStats })));
const Roadmap = lazy(() => import('./components/Roadmap').then((m) => ({ default: m.Roadmap })));
const Help = lazy(() => import('./components/Help').then((m) => ({ default: m.Help })));
const WallOfFame = lazy(() => import('./components/WallOfFame').then((m) => ({ default: m.WallOfFame })));
const Notes = lazy(() => import('./components/Notes').then((m) => ({ default: m.Notes })));
const SavedSearches = lazy(() => import('./components/SavedSearches').then((m) => ({ default: m.SavedSearches })));
const SearchHistory = lazy(() => import('./components/SearchHistory').then((m) => ({ default: m.SearchHistory })));
const CuratorPicks = lazy(() => import('./components/CuratorPicks').then((m) => ({ default: m.CuratorPicks })));
const BrowseByStage = lazy(() => import('./components/BrowseByStage').then((m) => ({ default: m.BrowseByStage })));
const CoFounderMatch = lazy(() => import('./components/CoFounderMatch').then((m) => ({ default: m.CoFounderMatch })));
const DigestPreview = lazy(() => import('./components/DigestPreview').then((m) => ({ default: m.DigestPreview })));
const NotFound = lazy(() => import('./components/NotFound').then((m) => ({ default: m.NotFound })));
const ReadingMode = lazy(() => import('./components/ReadingMode').then((m) => ({ default: m.ReadingMode })));
const Moderation = lazy(() => import('./components/Moderation').then((m) => ({ default: m.Moderation })));
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { Toaster } from './components/ui/Toaster';
import { TooltipProvider } from './components/ui/Tooltip';
import { FullPageSpinner } from './components/ui/Spinner';
import { useTheme } from './hooks/useTheme';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { useHotkeys } from './hooks/useHotkeys';
import { useStreak } from './hooks/useStreak';
import { useKonami } from './hooks/useKonami';
import { OnboardingTour } from './components/OnboardingTour';
import { CookieConsent } from './components/CookieConsent';
import { celebrate, playSound } from './utils/effects';
import { useA11y } from './hooks/useA11y';
import { useTimeOfDayTint } from './hooks/useTimeOfDay';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    const [page, setPage] = useState<Page>('feed');
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [unlockedAchievementsQueue, setUnlockedAchievementsQueue] = useState<AchievementId[]>([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    // Theme is now managed by the useTheme hook (applies class to <html>)
    const { resolvedTheme, toggle: toggleTheme } = useTheme();

    // Tracks daily streak (no-op when not logged in but harmless)
    useStreak();
    // Applies a11y classes to <html> based on user prefs
    useA11y();
    // Subtle tint based on time of day
    useTimeOfDayTint();

    const handleNavigation = useCallback((newPage: Page, id?: string) => {
        setPage(newPage);
        setSelectedIdeaId(
            newPage === 'ideaDetail' || newPage === 'ideaBoard' || newPage === 'forum' ||
            newPage === 'analytics' || newPage === 'kanban' || newPage === 'tag' ||
            newPage === 'browseByStage' || newPage === 'reading'
                ? id ?? null
                : null
        );
        setSelectedUserId(newPage === 'profile' && id ? id : null);
        setSelectedConversationId(newPage === 'chat' && id ? id : null);

        // Mirror page → URL hash for shareable links: tag pages, user profiles,
        // and stage-filtered browse pages. Everything else stays SPA-state-only.
        let nextHash: string | null = null;
        if (newPage === 'tag' && id) nextHash = `#tag/${encodeURIComponent(id)}`;
        else if (newPage === 'profile' && id) nextHash = `#user/${encodeURIComponent(id)}`;
        else if (newPage === 'browseByStage' && id) nextHash = `#stage/${encodeURIComponent(id)}`;

        const isHashRoute = /^#(tag|user|stage)\//.test(window.location.hash);
        if (nextHash) {
            if (window.location.hash !== nextHash) {
                window.history.replaceState(null, '', nextHash);
            }
        } else if (isHashRoute) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        window.scrollTo(0, 0);
    }, []);

    // Hash-route: parse `#tag/<name>`, `#user/<userId>`, and `#stage/<stage>`
    // on first load AND on browser back/forward. Shareable URLs hit the right
    // page even though we don't run a real router.
    useEffect(() => {
        const apply = () => {
            let m = window.location.hash.match(/^#tag\/(.+)$/);
            if (m) {
                setPage('tag');
                setSelectedIdeaId(decodeURIComponent(m[1]));
                return;
            }
            m = window.location.hash.match(/^#user\/(.+)$/);
            if (m) {
                setPage('profile');
                setSelectedUserId(decodeURIComponent(m[1]));
                return;
            }
            m = window.location.hash.match(/^#stage\/(.+)$/);
            if (m) {
                setPage('browseByStage');
                setSelectedIdeaId(decodeURIComponent(m[1]));
                return;
            }
        };
        apply();
        window.addEventListener('hashchange', apply);
        return () => window.removeEventListener('hashchange', apply);
    }, []);

    const handleSetCurrentUser = useCallback((user: User | null) => {
        if (user === null) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        } else {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        setCurrentUser(user);
        setIsGuest(false);
    }, []);

    const handleGuestLogin = useCallback(() => {
        setIsGuest(true);
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        handleNavigation('feed');
    }, [handleNavigation]);

    const handleNavigateToLogin = useCallback(() => {
        setIsGuest(false);
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }, []);

    const handleLogout = useCallback(() => {
        handleNavigateToLogin();
        handleNavigation('feed');
    }, [handleNavigateToLogin, handleNavigation]);

    const handleGuestAction = useCallback(() => setShowLoginPrompt(true), []);

    const handleUnlockAchievements = useCallback((achievementIds: AchievementId[]) => {
        if (achievementIds?.length) {
            setUnlockedAchievementsQueue((prev) => [...prev, ...achievementIds]);
        }
    }, []);

    const handleModalClose = useCallback(() => {
        setUnlockedAchievementsQueue((prev) => prev.slice(1));
    }, []);

    const handleOnboardingComplete = useCallback(() => {
        if (currentUser) {
            const updatedUser = { ...currentUser, onboardingCompleted: true };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            handleNavigation('feed');
        }
    }, [currentUser, handleNavigation]);

    // Global hotkeys
    useHotkeys('?', () => setShortcutsOpen(true));
    useHotkeys('mod+/', toggleTheme);
    useHotkeys('g f', () => handleNavigation('feed'));
    useHotkeys('g e', () => handleNavigation('explore'));
    useHotkeys('g p', () => currentUser && handleNavigation('profile', currentUser.userId));
    useHotkeys('g i', () => currentUser && handleNavigation('inbox'));
    useHotkeys('g n', () => currentUser && handleNavigation('notifications'));
    useHotkeys('n', () => currentUser && handleNavigation('newIdea'));

    // Konami easter egg
    useKonami(() => {
        celebrate('large');
        playSound('unlock');
        const el = document.documentElement;
        el.classList.add('animate-pulse-soft');
        setTimeout(() => el.classList.remove('animate-pulse-soft'), 1200);
    });

    // Bootstrap auth on mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const cachedUser = localStorage.getItem('currentUser');

        const finish = () => setIsBooting(false);

        if (token && cachedUser) {
            try {
                const user: User = JSON.parse(cachedUser);
                setCurrentUser(user);
                api.verifyToken(token)
                    .then((response) => {
                        if (!response.valid) {
                            handleNavigateToLogin();
                        } else if (response.user?.userId) {
                            api.getUserById(response.user.userId)
                                .then((fullUser) => { if (fullUser) handleSetCurrentUser(fullUser); })
                                .catch((e) => console.warn('Silent user refresh failed:', e));
                        }
                    })
                    .catch((err) => {
                        console.error('Token verification failed:', err);
                        handleNavigateToLogin();
                    })
                    .finally(finish);
            } catch {
                handleNavigateToLogin();
                finish();
            }
        } else if (token) {
            api.verifyToken(token)
                .then((response) => {
                    if (response.valid && response.user?.userId) {
                        return api.getUserById(response.user.userId).then((fullUser) => {
                            if (fullUser) handleSetCurrentUser(fullUser);
                        });
                    } else {
                        handleNavigateToLogin();
                    }
                })
                .catch(() => handleNavigateToLogin())
                .finally(finish);
        } else {
            handleGuestLogin();
            finish();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isBooting) {
        return <FullPageSpinner label="Loading Synapse…" />;
    }

    if (!currentUser && !isGuest) {
        return <Login setCurrentUser={handleSetCurrentUser} setPage={handleNavigation} onGuestLogin={handleGuestLogin} />;
    }

    if (currentUser && !currentUser.onboardingCompleted) {
        return <Onboarding setCurrentUser={setCurrentUser} onComplete={handleOnboardingComplete} currentUser={currentUser} />;
    }

    const renderPage = () => {
        const isProtectedPage = [
            'inbox', 'notifications', 'notificationSettings', 'profile', 'newIdea',
            'ideaBoard', 'kanban', 'forum', 'connections', 'bookmarks', 'chat',
            'analytics', 'settings'
        ].includes(page);

        if (isProtectedPage && (isGuest || !currentUser)) {
            handleNavigation('feed');
            return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }

        switch (page) {
            case 'feed':
                return <Feed currentUser={currentUser} setPage={handleNavigation} />;
            case 'explore':
                return <Explore currentUser={currentUser} setPage={handleNavigation} />;
            case 'inbox':
                return <Inbox currentUser={currentUser!} setPage={handleNavigation} />;
            case 'notifications':
                return <NotificationsPage setPage={handleNavigation} />;
            case 'notificationSettings':
                return <NotificationSettings currentUser={currentUser!} setCurrentUser={setCurrentUser} setPage={handleNavigation} />;
            case 'settings':
                return <Settings currentUser={currentUser!} setCurrentUser={setCurrentUser} setPage={handleNavigation} onLogout={handleLogout} />;
            case 'profile':
                return <Profile userId={selectedUserId || currentUser!.userId} currentUser={currentUser!} setPage={handleNavigation} />;

            case 'ideaDetail':
                if (selectedIdeaId)
                    return (
                        <IdeaDetail
                            ideaId={selectedIdeaId}
                            currentUser={currentUser}
                            isGuest={isGuest}
                            setPage={handleNavigation}
                            onAchievementsUnlock={handleUnlockAchievements}
                            onGuestAction={handleGuestAction}
                        />
                    );
                break;
            case 'ideaBoard':
                if (selectedIdeaId) return <IdeaBoard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'kanban':
                if (selectedIdeaId) return <KanbanBoard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'forum':
                if (selectedIdeaId) return <DiscussionForum ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'analytics':
                if (selectedIdeaId) return <AnalyticsDashboard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;

            case 'newIdea':
                return <NewIdeaForm setPage={handleNavigation} setSelectedIdeaId={setSelectedIdeaId} onAchievementsUnlock={handleUnlockAchievements} />;
            case 'connections':
                return <Connections userId={currentUser!.userId} setPage={handleNavigation} />;
            case 'bookmarks':
                return <Bookmarks currentUser={currentUser!} setPage={handleNavigation} />;
            case 'chat':
                if (selectedConversationId) return <Chat conversationId={selectedConversationId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'verify-email':
                return <VerifyEmail setPage={handleNavigation} setCurrentUser={setCurrentUser} />;
            case 'forgot-password':
                return <ForgotPassword setPage={handleNavigation} />;
            case 'reset-password':
                return <ResetPassword setPage={handleNavigation} />;
            case 'search':
                return <AdvancedSearch onClose={() => handleNavigation('feed')} />;
            case 'trending':
                return <TrendingAndRecommendations />;
            case 'notificationCenter':
                return <NotificationCenter onClose={() => handleNavigation('feed')} />;
            case 'onboarding':
                if (currentUser) {
                    return <Onboarding setCurrentUser={setCurrentUser} onComplete={handleOnboardingComplete} currentUser={currentUser} />;
                }
                break;
            case 'privacyPolicy':
            case 'privacy':
                return <PrivacyPolicy setPage={handleNavigation} />;
            case 'leaderboard':
                return <Leaderboard currentUser={currentUser} setPage={handleNavigation} />;
            case 'achievements':
                return <Achievements currentUser={currentUser} />;
            case 'drafts':
                return <Drafts setPage={handleNavigation} />;
            case 'tag':
                // Tag is passed via selectedIdeaId slot (reusing the id channel
                // rather than threading a fourth piece of route state through App).
                return <TagPage tag={selectedIdeaId || ''} currentUser={currentUser} setPage={handleNavigation} />;
            case 'spaces':
                return <Spaces setPage={handleNavigation} />;
            case 'events':
                return <Events setPage={handleNavigation} />;
            case 'premium':
                return <Premium setPage={handleNavigation} />;
            case 'investor':
                return <InvestorMode setPage={handleNavigation} />;
            case 'activity':
                return <ActivityTimeline setPage={handleNavigation} />;
            case 'quests':
                return <Quests setPage={handleNavigation} />;
            case 'mentorship':
                return <Mentorship setPage={handleNavigation} />;
            case 'developer':
                return <DeveloperSettings setPage={handleNavigation} />;
            case 'bounties':
                return <Bounties setPage={handleNavigation} />;
            case 'jobs':
                return <JobBoard setPage={handleNavigation} />;
            case 'compare':
                return <CompareIdeas setPage={handleNavigation} />;
            case 'trendingTags':
                return <TrendingTags setPage={handleNavigation} />;
            case 'status':
                return <StatusPage setPage={handleNavigation} />;
            case 'changelog':
                return <Changelog setPage={handleNavigation} />;
            case 'stats':
                return <PublicStats setPage={handleNavigation} />;
            case 'roadmap':
                return <Roadmap setPage={handleNavigation} />;
            case 'help':
                return <Help setPage={handleNavigation} />;
            case 'wallOfFame':
                return <WallOfFame setPage={handleNavigation} />;
            case 'notes':
                return <Notes setPage={handleNavigation} />;
            case 'savedSearches':
                return <SavedSearches setPage={handleNavigation} />;
            case 'searchHistory':
                return <SearchHistory setPage={handleNavigation} />;
            case 'curatorPicks':
                return <CuratorPicks setPage={handleNavigation} />;
            case 'browseByStage':
                return <BrowseByStage setPage={handleNavigation} initialStage={(selectedIdeaId || undefined) as any} />;
            case 'coFounderMatch':
                return <CoFounderMatch setPage={handleNavigation} currentUser={currentUser} />;
            case 'digest':
                return <DigestPreview setPage={handleNavigation} currentUser={currentUser} />;
            case 'reading':
                return <ReadingMode setPage={handleNavigation} ideaId={selectedIdeaId} />;
            case 'notFound':
                return <NotFound setPage={handleNavigation} />;
            case 'moderation':
                return <Moderation setPage={handleNavigation} currentUser={currentUser} />;
            default:
                return <NotFound setPage={handleNavigation} />;
        }

        if (selectedIdeaId === null && ['ideaDetail', 'ideaBoard', 'kanban', 'forum', 'analytics'].includes(page)) {
            handleNavigation('feed');
            return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        if (selectedConversationId === null && page === 'chat') {
            handleNavigation('feed');
            return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        return <Feed currentUser={currentUser} setPage={handleNavigation} />;
    };

    const fullScreenPages: Page[] = [
        'ideaBoard', 'forum', 'chat', 'analytics', 'notificationSettings', 'onboarding',
        'kanban', 'verify-email', 'forgot-password', 'reset-password', 'search',
        'notificationCenter', 'settings',
    ];
    const showHeader = !fullScreenPages.includes(page);
    const showBottomNav = showHeader && page !== 'newIdea' && page !== 'ideaDetail' && page !== 'privacyPolicy' && page !== 'privacy';

    return (
        <TooltipProvider delayDuration={250}>
            <div className="min-h-screen font-sans">
                <ErrorBoundary>
                    {showHeader && (
                        <Header
                            currentUser={currentUser}
                            isGuest={isGuest}
                            setPage={handleNavigation}
                            setCurrentUser={handleSetCurrentUser}
                            onGuestAction={handleGuestAction}
                            onNavigateToLogin={handleNavigateToLogin}
                            theme={resolvedTheme}
                            toggleTheme={toggleTheme}
                            onOpenPalette={() => setPaletteOpen(true)}
                        />
                    )}
                    <main className={`${showHeader ? 'pt-16' : ''} ${showBottomNav ? 'pb-20' : ''}`}>
                        <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                            {renderPage()}
                        </Suspense>
                    </main>
                    {showBottomNav && (
                        <BottomNavBar
                            activePage={page}
                            setPage={handleNavigation}
                            currentUser={currentUser}
                            isGuest={isGuest}
                            onGuestAction={handleGuestAction}
                        />
                    )}

                    <CommandPalette
                        open={paletteOpen}
                        onOpenChange={setPaletteOpen}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                        isAuthenticated={!!currentUser && !isGuest}
                    />

                    {unlockedAchievementsQueue.length > 0 && currentUser && (
                        <AchievementUnlockedModal
                            achievementId={unlockedAchievementsQueue[0]}
                            onClose={handleModalClose}
                            onShare={() => {
                                api.shareAchievementToFeed(unlockedAchievementsQueue[0]);
                                handleModalClose();
                            }}
                        />
                    )}

                    <LoginPromptModal
                        isOpen={showLoginPrompt}
                        onClose={() => setShowLoginPrompt(false)}
                        onNavigateToLogin={handleNavigateToLogin}
                    />

                    <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
                    <OnboardingTour active={!!currentUser && !isGuest} />
                    <PWAInstallPrompt />
                    <CookieConsent />
                    <Toaster />
                </ErrorBoundary>
            </div>
        </TooltipProvider>
    );
};

export default App;
