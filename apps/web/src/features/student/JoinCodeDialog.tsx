import { useState } from "react";
import { Modal } from "../../components/Modal";
import { CodeInput } from "../../components/CodeInput";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useTranslateError } from "../../i18n/i18n";

const CODE_LENGTH = 6;
const MIN_LENGTH = 4;

export function JoinCodeDialog({
  current,
  onClose,
  onJoined,
}: {
  current: string | null;
  onClose: () => void;
  onJoined: () => void;
}) {
  const { t } = useI18n();
  const translateError = useTranslateError();
  const { token, refresh } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (code.length < MIN_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/groups/join", { code }, token);
      await refresh();
      onJoined();
      onClose();
    } catch (err) {
      setError(translateError(err instanceof ApiError ? err.code : "network"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      icon="key"
      title={t(current ? "student.class.change" : "student.class.join")}
      subtitle={t("student.class.hint")}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <span className="label">{t("group.join.code")}</span>
          <CodeInput value={code} onChange={setCode} length={CODE_LENGTH} />
          <p className="mt-2.5 text-start text-xs text-muted">{t("group.join.codeHint")}</p>
        </div>

        <ul className="space-y-1.5 rounded-2xl border border-edge/70 bg-ink/25 px-4 py-3 text-start text-xs text-muted">
          <li>{t("group.join.single")}</li>
          {current && <li className="text-teal">{t("group.join.switchHint")}</li>}
          <li>{t("group.join.transferHint")}</li>
        </ul>

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn-primary w-full"
          onClick={submit}
          disabled={busy || code.length < MIN_LENGTH || code.length > CODE_LENGTH}
        >
          {t(current ? "group.join.switch" : "group.join.action")}
        </button>
      </div>
    </Modal>
  );
}
