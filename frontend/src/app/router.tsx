import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CheckinPage } from "@/features/dashboard/CheckinPage";
import { WorkoutsPage } from "@/features/dashboard/WorkoutsPage";
import { WorkoutSessionPage } from "@/features/dashboard/WorkoutSessionPage";
import { AnalyticsPage } from "@/features/dashboard/AnalyticsPage";
import { NutritionPage } from "@/features/dashboard/NutritionPage";
import { GoalsPage } from "@/features/dashboard/GoalsPage";
import { AchievementsPage } from "@/features/dashboard/AchievementsPage";
import { FeedPage } from "@/features/social/FeedPage";
import { LeaderboardPage } from "@/features/social/LeaderboardPage";
import { NotificationsPage } from "@/features/social/NotificationsPage";
import { PublicProfilePage } from "@/features/social/PublicProfilePage";
import { MessagesPage } from "@/features/social/MessagesPage";
import { FriendsPage } from "@/features/social/FriendsPage";
import { GroupsPage } from "@/features/social/GroupsPage";
import { GroupDetailPage } from "@/features/social/GroupDetailPage";
import { ChallengesPage } from "@/features/social/ChallengesPage";
import { CoachPage } from "@/features/coach/CoachPage";
import { ActivityPage } from "@/features/social/ActivityPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { AdminPage } from "@/features/admin/AdminPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/u/:username", element: <PublicProfilePage /> },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "checkin", element: <CheckinPage /> },
      { path: "workouts", element: <WorkoutsPage /> },
      { path: "session/:id", element: <WorkoutSessionPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "feed", element: <FeedPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "friends", element: <FriendsPage /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "groups/:id", element: <GroupDetailPage /> },
      { path: "challenges", element: <ChallengesPage /> },
      { path: "coach", element: <CoachPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "nutrition", element: <NutritionPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "achievements", element: <AchievementsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
