import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./lib/auth";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { TeacherHome } from "./features/teacher/TeacherHome";
import { LessonPage } from "./features/teacher/LessonPage";
import { StudentHome } from "./features/student/StudentHome";
import { StudentLessonPage } from "./features/student/StudentLessonPage";
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
      <AppShell>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </AppShell>
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
        <Route path="/" element={<TeacherHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
