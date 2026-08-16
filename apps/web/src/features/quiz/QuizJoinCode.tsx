import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useI18n } from "../../i18n/i18n";

export function QuizJoinCode({ pin }: { pin: string }) {
  const { t } = useI18n();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const link = `${window.location.origin}/quiz?pin=${pin}`;
    QRCode.toDataURL(link, { margin: 1, width: 320, color: { dark: "#0b162a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [pin]);

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-2xl bg-gradient-to-br from-teal/60 to-azure/60 p-[2px]">
        <div className="rounded-[15px] bg-white p-2">
          {qr ? (
            <img src={qr} alt="" width={112} height={112} className="h-28 w-28" />
          ) : (
            <div className="skeleton h-28 w-28" />
          )}
        </div>
      </div>
      <p className="max-w-[150px] text-xs leading-relaxed text-muted">{t("quiz.scan")}</p>
    </div>
  );
}
