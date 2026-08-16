import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { NavIcon } from "../../components/NavIcon";
import { useI18n } from "../../i18n/i18n";
import { QUIZ_PIN_LENGTH, QUIZ_SCAN_MS } from "./quiz.const";
import { pinFromScan, type ScanState } from "./quiz.scan";

export function QrScanner({ onFound }: { onFound: (pin: string) => void }) {
  const { t } = useI18n();

  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScanState>("idle");

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    setState("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
      setState("scanning");
    } catch {
      stop();
      setState("denied");
    }
  };

  const close = () => {
    stop();
    setState("idle");
  };

  const readFrame = useCallback(() => {
    const source = video.current;
    const canvas = frame.current;
    if (!source || !canvas || source.readyState < source.HAVE_CURRENT_DATA) return;

    const width = source.videoWidth;
    const height = source.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(source, 0, 0, width, height);
    const found = jsQR(context.getImageData(0, 0, width, height).data, width, height);
    const pin = found ? pinFromScan(found.data, QUIZ_PIN_LENGTH) : null;
    if (!pin) return;

    stop();
    setState("idle");
    onFound(pin);
  }, [onFound, stop]);

  useEffect(() => {
    if (state !== "scanning") return;
    const id = window.setInterval(readFrame, QUIZ_SCAN_MS);
    return () => window.clearInterval(id);
  }, [state, readFrame]);

  if (state === "idle" || state === "denied" || state === "unsupported") {
    return (
      <div className="space-y-2">
        <button type="button" className="btn-ghost w-full" onClick={() => void start()}>
          <NavIcon name="scan" className="h-4 w-4" />
          {t("quiz.scan.start")}
        </button>
        <p
          className={`text-start text-xs ${state === "idle" ? "text-muted" : "text-coral"}`}
        >
          {t(
            state === "denied"
              ? "quiz.scan.denied"
              : state === "unsupported"
                ? "quiz.scan.unsupported"
                : "quiz.scan.hint",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-teal/40 bg-ink/60">
        <video ref={video} playsInline muted className="h-56 w-full object-cover" />
        <canvas ref={frame} className="hidden" />

        <span className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-teal/70" />
        <span className="pointer-events-none absolute inset-x-6 top-6 h-0.5 animate-scanLine bg-teal" />

        <span className="absolute start-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-teal">
          {t(state === "starting" ? "quiz.scan.starting" : "quiz.scan.searching")}
        </span>
      </div>

      <button type="button" className="btn-ghost w-full" onClick={close}>
        {t("quiz.scan.stop")}
      </button>
    </div>
  );
}
