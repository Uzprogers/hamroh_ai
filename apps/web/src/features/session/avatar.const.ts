export const SIMLI_API_KEY = import.meta.env.VITE_SIMLI_API_KEY ?? "";
export const SIMLI_FACE_ID =
  import.meta.env.VITE_SIMLI_FACE_ID ?? "cace3ef7-a4c4-425d-a8cf-a5358eb0c427";

export const SIMLI_MAX_SESSION_SECONDS = 1800;
export const SIMLI_MAX_IDLE_SECONDS = 600;
export const SIMLI_MODEL = "fasttalk" as const;

export const SIMLI_FRAME_BYTES = 6000;
export const SIMLI_FLUSH_MS = 180;
export const SIMLI_START_TIMEOUT_MS = 25000;

export const HOLO_PARTICLES = 620;
export const HOLO_SPIN = 0.5;
export const HOLO_LEVEL_GAIN = 2.8;
export const HOLO_BUSY_LEVEL = 0.32;
export const HOLO_IDLE_LEVEL = 0.1;
export const HOLO_SMOOTHING = 0.18;
