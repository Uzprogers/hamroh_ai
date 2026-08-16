import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QuizReportView } from "./QuizReportView";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";
import type { QuizReport } from "./quiz.types";

export function QuizReportPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const translateError = useTranslateError();

  const [report, setReport] = useState<QuizReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<QuizReport>(`/quiz/sessions/${id}/report`, token)
      .then(setReport)
      .catch((err) => setError(translateError(err instanceof ApiError ? err.code : "network")));
  }, [id, token, translateError]);

  return (
    <div className="space-y-5 py-6">
      <Link to="/results" className="chip">
        ← {t("student.myResults")}
      </Link>

      {error && (
        <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
          {error}
        </p>
      )}

      {!report && !error && <div className="skeleton h-64" />}
      {report && <QuizReportView report={report} />}
    </div>
  );
}
