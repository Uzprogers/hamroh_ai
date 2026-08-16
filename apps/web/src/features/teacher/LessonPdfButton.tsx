import { useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";

function filenameOf(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  return match ? match[1] : fallback;
}

export function LessonPdfButton({ lessonId }: { lessonId: string }) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [preparing, setPreparing] = useState(false);

  const download = async () => {
    if (preparing) return;
    setPreparing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/pdf`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return;

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameOf(response, `test-${lessonId}.pdf`);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <button type="button" className="btn-ghost" onClick={download} disabled={preparing}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
      </svg>
      <span className="text-start">{preparing ? t("lesson.pdf.preparing") : t("lesson.pdf.download")}</span>
    </button>
  );
}
