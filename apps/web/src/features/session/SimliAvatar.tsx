import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useI18n } from "../../i18n/i18n";
import {
  SIMLI_API_KEY,
  SIMLI_FACE_ID,
  SIMLI_FLUSH_MS,
  SIMLI_FRAME_BYTES,
  SIMLI_MAX_IDLE_SECONDS,
  SIMLI_MAX_SESSION_SECONDS,
  SIMLI_MODEL,
  SIMLI_START_TIMEOUT_MS,
  SIMLI_VIDEO_WAIT_MS,
} from "./avatar.const";
import type { AvatarHandle, AvatarStatus } from "./avatar.types";

interface SimliAvatarProps {
  active: boolean;
  speaking: boolean;
  onStatus: (status: AvatarStatus) => void;
}

interface SimliSession {
  sendAudioData: (data: Uint8Array) => void;
  ClearBuffer: () => void;
  stop: () => Promise<void>;
}

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      video.removeEventListener("playing", done);
      video.removeEventListener("loadeddata", done);
      resolve();
    };
    const timer = setTimeout(done, SIMLI_VIDEO_WAIT_MS);
    video.addEventListener("playing", done);
    video.addEventListener("loadeddata", done);
  });
}

export const SimliAvatar = forwardRef<AvatarHandle, SimliAvatarProps>(function SimliAvatar(
  { active, speaking, onStatus },
  ref,
) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<SimliSession | null>(null);
  const [status, setStatus] = useState<AvatarStatus>("off");

  const tailRef = useRef<Uint8Array>(new Uint8Array(0));
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      push: (pcm) => {
        const client = clientRef.current;
        if (!client) return;

        const merged = new Uint8Array(tailRef.current.length + pcm.byteLength);
        merged.set(tailRef.current, 0);
        merged.set(new Uint8Array(pcm), tailRef.current.length);

        let offset = 0;
        while (merged.length - offset >= SIMLI_FRAME_BYTES) {
          client.sendAudioData(merged.slice(offset, offset + SIMLI_FRAME_BYTES));
          offset += SIMLI_FRAME_BYTES;
        }
        tailRef.current = merged.slice(offset);

        if (flushRef.current) clearTimeout(flushRef.current);
        flushRef.current = setTimeout(() => {
          const tail = tailRef.current;
          tailRef.current = new Uint8Array(0);
          if (!tail.length || !clientRef.current) return;
          const padded = new Uint8Array(SIMLI_FRAME_BYTES);
          padded.set(tail, 0);
          clientRef.current.sendAudioData(padded);
        }, SIMLI_FLUSH_MS);
      },
      clear: () => {
        if (flushRef.current) clearTimeout(flushRef.current);
        tailRef.current = new Uint8Array(0);
        clientRef.current?.ClearBuffer();
      },
    }),
    [],
  );

  useEffect(() => {
    if (!active || !SIMLI_API_KEY) return;

    let alive = true;
    const move = (next: AvatarStatus) => {
      if (!alive) return;
      setStatus(next);
      onStatus(next);
    };

    move("starting");
    const guard = setTimeout(() => move("failed"), SIMLI_START_TIMEOUT_MS);

    void (async () => {
      try {
        const { SimliClient, generateSimliSessionToken } = await import("simli-client");
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!alive || !video || !audio) return;

        const { session_token } = await generateSimliSessionToken({
          apiKey: SIMLI_API_KEY,
          config: {
            faceId: SIMLI_FACE_ID,
            handleSilence: true,
            maxSessionLength: SIMLI_MAX_SESSION_SECONDS,
            maxIdleTime: SIMLI_MAX_IDLE_SECONDS,
            model: SIMLI_MODEL,
          },
        });
        if (!alive) return;

        const client = new SimliClient(session_token, video, audio, null, undefined, "livekit");
        await client.start();
        if (!alive) {
          void client.stop();
          return;
        }

        clientRef.current = client;
        void audio.play().catch(() => undefined);
        await waitForVideo(video);
        if (!alive) return;

        clearTimeout(guard);
        move("live");
      } catch {
        clearTimeout(guard);
        move("failed");
      }
    })();

    return () => {
      alive = false;
      clearTimeout(guard);
      void clientRef.current?.stop().catch(() => undefined);
      clientRef.current = null;
      setStatus("off");
    };
  }, [active, onStatus]);

  return (
    <div className="relative h-full w-full">
      <span
        className={`pointer-events-none absolute inset-x-8 top-6 bottom-10 rounded-[40%] bg-gradient-to-br from-teal/30 to-azure/25 blur-3xl transition-opacity duration-500 ${
          speaking ? "opacity-90" : "opacity-50"
        }`}
      />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`relative h-full w-full object-cover transition-opacity duration-700 ${
          status === "live" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          maskImage:
            "radial-gradient(120% 90% at 50% 40%, black 55%, rgba(0,0,0,0.55) 78%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 40%, black 55%, rgba(0,0,0,0.55) 78%, transparent 100%)",
        }}
      />
      <audio ref={audioRef} autoPlay />

      {status === "starting" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <span className="h-12 w-12 animate-spin rounded-full border-2 border-edge border-t-teal" />
            <span className="text-xs uppercase tracking-widest text-muted">
              {t("session.avatar.loading")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
