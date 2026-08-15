import { useState } from "react";
import { AuthScreen } from "./AuthScreen";
import { SocialButtons } from "./SocialButtons";
import { TelegramDialog } from "./TelegramDialog";
import { useI18n } from "../../i18n/i18n";

export function LoginPage() {
  const { t } = useI18n();
  const [telegramOpen, setTelegramOpen] = useState(false);

  return (
    <AuthScreen energy={0.14}>
      <div className="surface p-8 sm:p-10">
        <h2 className="font-display text-3xl font-extrabold">{t("auth.login.title")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("auth.login.subtitle")}</p>

        <div className="mt-7">
          <SocialButtons onTelegram={() => setTelegramOpen(true)} />
        </div>

        <p className="mt-7 rounded-2xl border border-edge/70 bg-ink/40 px-4 py-3 text-xs leading-relaxed text-muted">
          {t("auth.autoAccount")}
        </p>
      </div>

      {telegramOpen && <TelegramDialog onClose={() => setTelegramOpen(false)} />}
    </AuthScreen>
  );
}
