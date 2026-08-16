import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./lib/auth";
import { LoginPage } from "./features/auth/LoginPage";
import { OnboardingPage } from "./features/auth/OnboardingPage";
import { LandingPage } from "./features/landing/LandingPage";
import { TeacherWorkspace } from "./features/teacher/TeacherWorkspace";
import { LessonPage } from "./features/teacher/LessonPage";
import { StudentHome } from "./features/student/StudentHome";
import { StudentLessonPage } from "./features/student/StudentLessonPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { GroupPage } from "./features/group/GroupPage";
import { SessionPage } from "./features/session/SessionPage";

export function App() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-edge border-t-teal" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!user.profile_completed || !user.role) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    );
  }

  if (user.role === "STUDENT") {
    return (
      <Routes>
        <Route path="/session" element={<SessionPage />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/lesson/:id" element={<StudentLessonPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/" element={<StudentHome />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/group/:id" element={<GroupPage />} />
        <Route path="*" element={<TeacherWorkspace />} />
      </Routes>
    </AppShell>
  );
}
