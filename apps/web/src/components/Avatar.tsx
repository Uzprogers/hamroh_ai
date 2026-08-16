import type { User } from "../lib/types";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

export function initials(user: Pick<User, "first_name" | "last_name">): string {
  const letters = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((part) => (part as string).trim().charAt(0).toUpperCase());
  return letters.join("") || "H";
}

export function Avatar({
  user,
  size = "md",
  ring = false,
}: {
  user: Pick<User, "first_name" | "last_name" | "avatar_url">;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  const frame = `relative grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-extrabold ${SIZES[size]}`;

  return (
    <span className={ring ? "rounded-full bg-gradient-to-br from-teal to-azure p-[2px]" : undefined}>
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt=""
          className={`${frame} border border-edge object-cover`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={`${frame} bg-gradient-to-br from-teal to-azure text-ink`}>
          {initials(user)}
        </span>
      )}
    </span>
  );
}
