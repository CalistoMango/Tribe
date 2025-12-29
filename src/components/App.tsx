"use client";

import { useEffect, useState, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { DiscoverTab, BountiesTab, EarningsTab, ReferralTab } from "~/components/ui/tabs";
// TODO: Re-enable when task verification is fully wired (Phase 4)
// import { TaskBanner } from "~/components/ui/TaskBanner";
// TODO: Re-enable when bounties are implemented (Phase 4)
// import { ProfileSetupModal } from "~/components/ui/ProfileSetupModal";
import { LoginScreen } from "~/components/ui/LoginScreen";
import { type TasksCompleted } from "~/lib/mockData";
import { Tab } from "~/lib/types";
import type { DbUser } from "~/lib/types";

const isDev = process.env.NODE_ENV === 'development';

export default function App() {
  // --- Hooks ---
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  // --- Local State ---
  // Check localStorage to see if user has previously signed in
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tribe_signed_in') === 'true';
    }
    return false;
  });
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [tasksCompleted, setTasksCompleted] = useState<TasksCompleted>({
    connected: false,
    followed: false,
    likedRecasted: false,
  });
  // TODO: Re-enable when bounties are implemented (Phase 4)
  // const [showProfileSetup, setShowProfileSetup] = useState(false);

  // All 3 earning tasks must be done
  const allTasksDone = tasksCompleted.connected && tasksCompleted.followed && tasksCompleted.likedRecasted;

  // --- Effects ---
  useEffect(() => {
    if (isSDKLoaded) {
      setInitialTab(Tab.Discover);
    }
  }, [isSDKLoaded, setInitialTab]);

  // Mark connected task as done when user is logged in
  useEffect(() => {
    if (isLoggedIn && context?.user) {
      setTasksCompleted(prev => ({ ...prev, connected: true }));
    }
  }, [isLoggedIn, context?.user]);

  // Bootstrap user in database when logged in
  const bootstrapUser = useCallback(async () => {
    if (!context?.user || isBootstrapping || dbUser) return;

    setIsBootstrapping(true);
    try {
      const response = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDbUser(data.user);
        console.log('User bootstrapped:', data.isNew ? 'new user' : 'existing user');
      } else {
        console.error('Bootstrap failed:', await response.text());
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
    } finally {
      setIsBootstrapping(false);
    }
  }, [context?.user, isBootstrapping, dbUser]);

  // Bootstrap user after login
  useEffect(() => {
    if (isLoggedIn && context?.user && !dbUser && !isBootstrapping) {
      bootstrapUser();
    }
  }, [isLoggedIn, context?.user, dbUser, isBootstrapping, bootstrapUser]);

  // --- Handlers ---
  const handleLogin = async () => {
    // Only allow login if we have Farcaster context (inside Warpcast)
    if (!context?.user) {
      return;
    }
    setIsLoggedIn(true);
    localStorage.setItem('tribe_signed_in', 'true');
    setTasksCompleted(prev => ({ ...prev, connected: true }));
    // Bootstrap will be triggered by the useEffect above
  };

  // TODO: Re-enable when task verification is fully wired (Phase 4)
  // const handleVerifyTask = async (task: 'followed' | 'likedRecasted') => {
  //   const fid = context?.user?.fid ?? dbUser?.fid;
  //   if (!fid) return;

  //   try {
  //     const response = await fetch('/api/tasks/verify', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         fid,
  //         task: task === 'followed' ? 'follow' : 'like_recast',
  //       }),
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.verified) {
  //         setTasksCompleted(prev => ({ ...prev, [task]: true }));
  //       } else {
  //         // TODO: Show user-friendly message that task is not yet complete
  //         console.log('Task not verified:', data.message);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Task verification error:', error);
  //   }
  // };

  // TODO: Re-enable when bounties are implemented (Phase 4)
  // const handleSaveProfile = (bio: string, categories: string[]) => {
  //   // Update local dbUser state with new profile data
  //   if (dbUser) {
  //     setDbUser({ ...dbUser, bio, categories, profile_setup_complete: true });
  //   }
  //   setShowProfileSetup(false);
  // };

  // --- Early Returns ---
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center text-white">
          <div className="spinner h-8 w-8 mx-auto mb-4 border-violet-500 border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if no Farcaster context (must be inside Warpcast)
  // OR if user hasn't completed the sign-in flow yet
  // Skip in dev mode for easier testing
  if (!isDev && (!context?.user || !isLoggedIn)) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // TODO: Re-enable when bounties are implemented (Phase 4)
  // Show profile setup modal
  // if (showProfileSetup && (context?.user?.fid || dbUser?.fid)) {
  //   return (
  //     <ProfileSetupModal
  //       fid={context?.user?.fid ?? dbUser?.fid ?? 0}
  //       onClose={() => setShowProfileSetup(false)}
  //       onSave={handleSaveProfile}
  //     />
  //   );
  // }

  // --- Render ---
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex flex-col"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <Header />

      {/* TODO: Re-enable when task verification is fully wired (Phase 4) */}
      {/* <TaskBanner
        tasksCompleted={tasksCompleted}
        onVerifyTask={handleVerifyTask}
      /> */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto p-4">
          {currentTab === Tab.Discover && <DiscoverTab />}
          {currentTab === Tab.Bounties && <BountiesTab allTasksDone={allTasksDone} />}
          {currentTab === Tab.Earnings && <EarningsTab />}
          {currentTab === Tab.Referral && <ReferralTab userFid={context?.user?.fid ?? dbUser?.fid ?? null} />}
        </div>
      </main>

      <Footer activeTab={currentTab as Tab} setActiveTab={setActiveTab} />
    </div>
  );
}
