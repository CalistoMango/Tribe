"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { DiscoverTab, BountiesTab, EarningsTab, ReferralTab } from "~/components/ui/tabs";
import { TaskBanner } from "~/components/ui/TaskBanner";
import { ProfileSetupModal } from "~/components/ui/ProfileSetupModal";
import { LoginScreen } from "~/components/ui/LoginScreen";
import { type TasksCompleted } from "~/lib/mockData";
import { Tab } from "~/lib/types";

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
  const [tasksCompleted, setTasksCompleted] = useState<TasksCompleted>({
    connected: false,
    followed: false,
    recasted: false,
    profile: false,
  });
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const allTasksDone = Object.values(tasksCompleted).every(v => v);

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

  // --- Handlers ---
  const handleLogin = () => {
    // Only allow login if we have Farcaster context (inside Warpcast)
    if (!context?.user) {
      return;
    }
    setIsLoggedIn(true);
    localStorage.setItem('tribe_signed_in', 'true');
    setTasksCompleted(prev => ({ ...prev, connected: true }));
  };

  const handleCompleteTask = (task: keyof TasksCompleted) => {
    setTasksCompleted(prev => ({ ...prev, [task]: true }));
  };

  const handleSaveProfile = () => {
    setTasksCompleted(prev => ({ ...prev, profile: true }));
    setShowProfileSetup(false);
  };

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
  if (!context?.user || !isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show profile setup modal
  if (showProfileSetup) {
    return (
      <ProfileSetupModal
        onClose={() => setShowProfileSetup(false)}
        onSave={handleSaveProfile}
      />
    );
  }

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

      {/* Task Banner */}
      <TaskBanner
        tasksCompleted={tasksCompleted}
        onCompleteTask={handleCompleteTask}
        onOpenProfileSetup={() => setShowProfileSetup(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto p-4">
          {currentTab === Tab.Discover && <DiscoverTab />}
          {currentTab === Tab.Bounties && <BountiesTab allTasksDone={allTasksDone} />}
          {currentTab === Tab.Earnings && <EarningsTab />}
          {currentTab === Tab.Referral && <ReferralTab />}
        </div>
      </main>

      <Footer activeTab={currentTab as Tab} setActiveTab={setActiveTab} />
    </div>
  );
}
