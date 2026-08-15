import { Injectable, UnauthorizedException } from "@nestjs/common";
import { env } from "../../../core/config/env.config";

export interface GoogleProfile {
  sub: string;
  email: string;
  first_name: string;
  last_name: string | null;
  picture: string | null;
}

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class GoogleProfileClient {
  async fetchProfile(token: string): Promise<GoogleProfile> {
    const info = (await this.fromIdToken(token)) ?? (await this.fromAccessToken(token));
    if (!info) throw new UnauthorizedException("GOOGLE_TOKEN_INVALID");
    return this.toProfile(info);
  }

  private async fromIdToken(token: string): Promise<GoogleTokenInfo | null> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
    );
    if (!response.ok) return null;

    const info = (await response.json()) as GoogleTokenInfo;
    if (env.google.clientId && info.aud !== env.google.clientId) {
      throw new UnauthorizedException("GOOGLE_TOKEN_INVALID");
    }
    return info;
  }

  private async fromAccessToken(token: string): Promise<GoogleTokenInfo | null> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as GoogleTokenInfo;
  }

  private toProfile(info: GoogleTokenInfo): GoogleProfile {
    const verified = info.email_verified === true || info.email_verified === "true";
    if (!info.sub || !info.email || !verified) {
      throw new UnauthorizedException("GOOGLE_TOKEN_INVALID");
    }

    const parts = (info.name ?? info.email.split("@")[0]).trim().split(/\s+/);

    return {
      sub: info.sub,
      email: info.email.toLowerCase(),
      first_name: info.given_name || parts[0],
      last_name: info.family_name || (parts.length > 1 ? parts.slice(1).join(" ") : null),
      picture: info.picture ?? null,
    };
  }
}
