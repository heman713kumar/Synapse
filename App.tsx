import React, { useState, useEffect } from 'react';
import { User, Page, AchievementId } from './types';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { Profile } from './components/Profile';
import { IdeaDetail } from './components/IdeaDetail';
import { NewIdeaForm } from './components/NewIdeaForm';
import { IdeaBoard } from './components/IdeaBoard';
import { Onboarding } from './components/Onboarding';
import { Connections } from './components/Connections';
import { Bookmarks } from './components/Bookmarks';
import { Inbox } from './components/Inbox';
import { Chat } from './components/Chat';
import { DiscussionForum } from './components/DiscussionForum';
import { BottomNavBar } from './components/BottomNavBar';
import { Explore } from './components/Explore';
import { NotificationsPage } from './components/NotificationsPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AchievementUnlockedModal } from './components/AchievementUnlockedModal';
import { api } from './services/mockApiService';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { NotificationSettings } from './components/NotificationSettings';
import { LoginPromptModal } from './components/LoginPromptModal';
import { KanbanBoard } from './components/KanbanBoard';

// FIX: Re-implemented the ErrorBoundary using modern class properties for state and an arrow function for the event handler. This approach is cleaner and more robustly handles the 'this' context, which appears to be the source of the compilation errors.
class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false }, () => window.location.reload());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
            <h1 className="text-3xl font-bold text-red-500">Something went wrong.</h1>
            <p className="mt-4 text-lg">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button
                onClick={this.handleRefresh}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
            >
                Refresh
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [page, setPage] = useState<Page>('feed');
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [unlockedAchievementsQueue, setUnlockedAchievementsQueue] = useState<AchievementId[]>([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };


    const handleNavigation = (page: Page, id?: string) => {
        setPage(page);
        setSelectedIdeaId(page === 'ideaDetail' || page === 'ideaBoard' || page === 'forum' || page === 'analytics' || page === 'kanban' ? id ?? null : null);
        setSelectedUserId(page === 'profile' && id ? id : null);
        setSelectedConversationId(page === 'chat' && id ? id : null);
        window.scrollTo(0, 0);
    };

    const handleSetCurrentUser = (user: User | null) => {
        setCurrentUser(user);
        setIsGuest(false); // Can't be a guest if you're logging in/out
    };
    
    const handleGuestLogin = () => {
        setIsGuest(true);
        setCurrentUser(null);
        handleNavigation('feed');
    };

    const handleNavigateToLogin = () => {
        setIsGuest(false);
        setCurrentUser(null);
        // The main render logic will now show the Login component
    };
    
    const handleGuestAction = () => {
        setShowLoginPrompt(true);
    };

    const handleUnlockAchievements = (achievementIds: AchievementId[]) => {
        if (achievementIds.length > 0) {
            setUnlockedAchievementsQueue(prev => [...prev, ...achievementIds]);
        }
    };
    
    const handleModalClose = () => {
        setUnlockedAchievementsQueue(prev => prev.slice(1));
    };

    if (!currentUser && !isGuest) {
        return <Login setCurrentUser={handleSetCurrentUser} setPage={handleNavigation} onGuestLogin={handleGuestLogin} />;
    }
    
    if (currentUser && !currentUser.onboardingCompleted) {
        return <Onboarding 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser}
            onComplete={() => handleNavigation('feed')} 
        />;
    }

    const renderPage = () => {
        switch (page) {
            case 'feed':
                return <Feed currentUser={currentUser} setPage={handleNavigation} />;
            case 'explore':
                return <Explore currentUser={currentUser!} setPage={handleNavigation} />;
            case 'inbox':
                if (isGuest) return null; // Should be handled by nav bar
                return <Inbox currentUser={currentUser!} setPage={handleNavigation} />;
            case 'notifications':
                 if (isGuest) return null;
                return <NotificationsPage userId={currentUser!.userId} setPage={handleNavigation} />;
            case 'notificationSettings':
                 if (isGuest) return null;
                return <NotificationSettings currentUser={currentUser!} setCurrentUser={setCurrentUser} setPage={handleNavigation} />;
            case 'profile':
                if (isGuest) return null;
                return <Profile userId={selectedUserId || currentUser!.userId} currentUser={currentUser!} setPage={handleNavigation} />;
            case 'ideaDetail':
                if (selectedIdeaId) return <IdeaDetail ideaId={selectedIdeaId} currentUser={currentUser} isGuest={isGuest} setPage={handleNavigation} onAchievementsUnlock={handleUnlockAchievements} onGuestAction={handleGuestAction} />;
                break;
            case 'newIdea':
                if (isGuest) return null;
                return <NewIdeaForm currentUser={currentUser!} setPage={handleNavigation} setSelectedIdeaId={setSelectedIdeaId} onAchievementsUnlock={handleUnlockAchievements} />;
            case 'ideaBoard':
                if (selectedIdeaId) return <IdeaBoard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'kanban':
                 if (isGuest) return null;
                if (selectedIdeaId) return <KanbanBoard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'forum':
                if (isGuest) return null;
                if (selectedIdeaId) return <DiscussionForum ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'connections':
                if (isGuest) return null;
                return <Connections userId={currentUser!.userId} setPage={handleNavigation} />;
            case 'bookmarks':
                if (isGuest) return null;
                return <Bookmarks currentUser={currentUser!} setPage={handleNavigation} />;
            case 'chat':
                if (isGuest) return null;
                if (selectedConversationId) return <Chat conversationId={selectedConversationId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            case 'privacyPolicy':
                return <PrivacyPolicy setPage={handleNavigation} />;
            case 'analytics':
                if (isGuest) return null;
                if (selectedIdeaId) return <AnalyticsDashboard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break;
            default:
                return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        // Fallback to feed if required ID is missing
        handleNavigation('feed');
        return <Feed currentUser={currentUser} setPage={handleNavigation} />;
    }

    const showHeader = page !== 'ideaBoard' && page !== 'forum' && page !== 'chat' && page !== 'analytics' && page !== 'notificationSettings' && page !== 'onboarding' && page !== 'kanban';
    const showBottomNav = showHeader && page !== 'newIdea' && page !== 'ideaDetail' && page !== 'privacyPolicy';

    return (
        <div className="min-h-screen font-sans">
             <ErrorBoundary>
                {showHeader && <Header currentUser={currentUser} isGuest={isGuest} setPage={handleNavigation} setCurrentUser={handleSetCurrentUser} onGuestAction={handleGuestAction} onNavigateToLogin={handleNavigateToLogin} theme={theme} toggleTheme={toggleTheme} />}
                <main className={`${showHeader ? "pt-16" : ""} ${showBottomNav ? "pb-20" : ""}`}>
                    {renderPage()}
                </main>
                {showBottomNav && <BottomNavBar activePage={page} setPage={handleNavigation} currentUser={currentUser} isGuest={isGuest} onGuestAction={handleGuestAction} />}

                {unlockedAchievementsQueue.length > 0 && currentUser && (
                    <AchievementUnlockedModal 
                        achievementId={unlockedAchievementsQueue[0]}
                        onClose={handleModalClose}
                        onShare={() => {
                            api.shareAchievementToFeed(currentUser.userId, unlockedAchievementsQueue[0]);
                            handleModalClose();
                        }}
                    />
                )}
                
                <LoginPromptModal 
                    isOpen={showLoginPrompt}
                    onClose={() => setShowLoginPrompt(false)}
                    onNavigateToLogin={handleNavigateToLogin}
                />
             </ErrorBoundary>
        </div>
    );
};

export default App;
