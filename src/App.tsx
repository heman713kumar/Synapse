// C:\Users\hemant\Downloads\synapse\src\App.tsx
import ConnectionTest from './components/ConnectionTest';
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
// This import is correct
import api from './services/backendApiService';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { NotificationSettings } from './components/NotificationSettings';
import { LoginPromptModal } from './components/LoginPromptModal';
import { KanbanBoard } from './components/KanbanBoard';

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
    
    // Developer flag to show connection test component
    const [showConnectionTest] = useState(true); // Set to false to hide

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
        if (user === null) {
            // Handle Logout
            localStorage.removeItem('authToken'); // Clear token on logout
        }
        // Save user to local storage for persistence across reloads
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsGuest(false);
    };
    
    const handleGuestLogin = () => {
        setIsGuest(true);
        setCurrentUser(null); // Ensure no user is set
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        handleNavigation('feed');
    };

    const handleNavigateToLogin = () => {
        setIsGuest(false);
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        // Main render logic will show Login component
    };
    
    const handleGuestAction = () => {
        setShowLoginPrompt(true);
    };

    const handleUnlockAchievements = (achievementIds: AchievementId[]) => {
        if (achievementIds && achievementIds.length > 0) {
            setUnlockedAchievementsQueue(prev => [...prev, ...achievementIds]);
        }
    };
    
    const handleModalClose = () => {
        setUnlockedAchievementsQueue(prev => prev.slice(1));
    };

    const handleOnboardingComplete = () => {
        if (currentUser) {
            const updatedUser = { ...currentUser, onboardingCompleted: true };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            handleNavigation('feed');
        }
    };

    // Check for existing token on app load
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const cachedUser = localStorage.getItem('currentUser');
        
        if (token && cachedUser) {
            const user: User = JSON.parse(cachedUser);
            setCurrentUser(user);

            // Optional: Re-verify token silently in the background
            api.verifyToken(token)
                .then(response => {
                    if (!response.valid) {
                        // Token is bad, log user out
                        handleNavigateToLogin();
                    } else if (response.user?.userId) {
                         // Token is good, refresh user data silently
                         api.getUserById(response.user.userId).then(fullUser => {
                             if(fullUser) handleSetCurrentUser(fullUser);
                         });
                    }
                })
                .catch(err => {
                    console.error("Token verification failed:", err);
                    handleNavigateToLogin(); // Log out on error
                });
        } else if (token) {
            // Has token but no cached user (e.g., old session)
             api.verifyToken(token)
                .then(response => {
                    if (response.valid && response.user?.userId) {
                        api.getUserById(response.user.userId).then(fullUser => {
                             if(fullUser) handleSetCurrentUser(fullUser);
                        });
                    } else {
                        handleNavigateToLogin();
                    }
                })
                .catch(() => {
                    handleNavigateToLogin();
                });
        }
         else {
            // No token, log in as guest
            handleGuestLogin();
        }
    }, []); // Empty dependency array means this runs once on app mount

    if (!currentUser && !isGuest) {
        // Show login page
        return <Login setCurrentUser={handleSetCurrentUser} setPage={handleNavigation} onGuestLogin={handleGuestLogin} />;
    }
    
    if (currentUser && !currentUser.onboardingCompleted) {
        // Force onboarding if user is logged in but hasn't completed it
        return <Onboarding 
            setCurrentUser={setCurrentUser} 
            onComplete={handleOnboardingComplete} 
            currentUser={currentUser} 
        />;
    }

    const renderPage = () => {
        // --- Centralized logic to prevent rendering protected pages for guests/no user ---
        const isProtectedPage = [
            'inbox', 'notifications', 'notificationSettings', 'profile', 'newIdea', 
            'ideaBoard', 'kanban', 'forum', 'connections', 'bookmarks', 'chat', 'analytics'
        ].includes(page);

        if (isProtectedPage && (isGuest || !currentUser)) {
            // If user tries to navigate to a protected page as a guest, redirect to feed.
            handleNavigation('feed');
            return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        
        // --- Main Switch for Rendering ---
        switch (page) {
            case 'feed':
                return <Feed currentUser={currentUser} setPage={handleNavigation} />;
            case 'explore':
                return <Explore currentUser={currentUser} setPage={handleNavigation} />;
            case 'inbox':
                // Note: Guest check already performed above
                return <Inbox currentUser={currentUser!} setPage={handleNavigation} />;
            case 'notifications':
                return <NotificationsPage setPage={handleNavigation} />;
            case 'notificationSettings':
                return <NotificationSettings currentUser={currentUser!} setCurrentUser={setCurrentUser} setPage={handleNavigation} />;
            case 'profile':
                // If selectedUserId is null, use current user's ID
                return <Profile userId={selectedUserId || currentUser!.userId} currentUser={currentUser!} setPage={handleNavigation} />;
            
            // --- Idea-related pages (must have selectedIdeaId) ---
            case 'ideaDetail':
                // FIX: Consolidated logic. If no ideaId, fallback happens below.
                if (selectedIdeaId) return <IdeaDetail ideaId={selectedIdeaId} currentUser={currentUser} isGuest={isGuest} setPage={handleNavigation} onAchievementsUnlock={handleUnlockAchievements} onGuestAction={handleGuestAction} />;
                break; // Fall through to missing ID logic
            case 'ideaBoard':
                // FIX: Consolidated logic. If no ideaId, fallback happens below.
                if (selectedIdeaId) return <IdeaBoard ideaId={selectedIdeaId} currentUser={currentUser!} setPage={handleNavigation} />;
                break; // Fall through to missing ID logic
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
            case 'privacyPolicy':
                return <PrivacyPolicy setPage={handleNavigation} />;
            default:
                // This shouldn't happen, but acts as a safe return
                return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }

        // --- Final Fallback Logic: Redirect to feed if an expected ID is missing ---
        if (selectedIdeaId === null && ['ideaDetail', 'ideaBoard', 'kanban', 'forum', 'analytics'].includes(page)) {
             handleNavigation('feed');
             return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        if (selectedConversationId === null && page === 'chat') {
             handleNavigation('feed');
             return <Feed currentUser={currentUser} setPage={handleNavigation} />;
        }
        
        // Final ultimate fallback (only reached if a switch case used break but didn't return a component)
        return <Feed currentUser={currentUser} setPage={handleNavigation} />;
    }

    const showHeader = page !== 'ideaBoard' && page !== 'forum' && page !== 'chat' && page !== 'analytics' && page !== 'notificationSettings' && page !== 'onboarding' && page !== 'kanban';
    const showBottomNav = showHeader && page !== 'newIdea' && page !== 'ideaDetail' && page !== 'privacyPolicy';

    return (
        <div className="min-h-screen font-sans">
             <ErrorBoundary>
                {/* Conditionally render ConnectionTest for debugging */}
                {showConnectionTest && <ConnectionTest />}
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
                            // FIX: Removed currentUser.userId. Backend gets this from token.
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
             </ErrorBoundary>
        </div>
    );
};

export default App;