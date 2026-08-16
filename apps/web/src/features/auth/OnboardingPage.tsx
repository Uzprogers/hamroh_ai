import { AuthScreen } from "./AuthScreen";
import { OnboardingDialog } from "./OnboardingDialog";
import { Avatar } from "../../components/Avatar";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";

export function OnboardingPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AuthScreen energy={0.18}>
      <div className="surface p-8 text-start sm:p-10">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" ring />
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-extrabold">
              {t("onboarding.hello").replace("{name}", user.first_name)}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("onboarding.details.subtitle")}</p>
          </div>
        </div>
      </div>

      <OnboardingDialog user={user} />
    </AuthScreen>
  );
}
