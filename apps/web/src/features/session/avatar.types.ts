export type AvatarStatus = "off" | "starting" | "live" | "failed";

export interface AvatarHandle {
  push: (pcm: ArrayBuffer) => void;
  clear: () => void;
}
