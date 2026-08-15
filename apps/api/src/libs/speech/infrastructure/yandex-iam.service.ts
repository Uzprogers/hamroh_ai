import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { constants, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { env } from "../../../core/config/env.config";

const IAM_URL = "https://iam.api.cloud.yandex.net/iam/v1/tokens";
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

interface ServiceAccountKey {
  id: string;
  service_account_id: string;
  private_key: string;
}

@Injectable()
export class YandexIamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(YandexIamService.name);
  private token: string | null = null;
  private timer: NodeJS.Timeout | null = null;

  async onModuleInit(): Promise<void> {
    await this.refresh();
    this.timer = setInterval(() => void this.refresh(), REFRESH_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  getToken(): string {
    if (!this.token) throw new Error("IAM_TOKEN_NOT_READY");
    return this.token;
  }

  private async refresh(): Promise<void> {
    try {
      this.token = await this.requestToken();
      this.logger.log("IAM token refreshed");
    } catch (err) {
      this.logger.error(`IAM token refresh failed: ${(err as Error).message}`);
    }
  }

  private async requestToken(): Promise<string> {
    const key = this.readKey();
    const response = await fetch(IAM_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jwt: this.buildJwt(key) }),
    });
    if (!response.ok) throw new Error(`IAM ${response.status}: ${await response.text()}`);
    const { iamToken } = (await response.json()) as { iamToken: string };
    return iamToken;
  }

  private readKey(): ServiceAccountKey {
    if (!env.yandex.keyPath) throw new Error("YANDEX_SERVICE_ACCOUNT_KEY_PATH is not set");
    return JSON.parse(readFileSync(env.yandex.keyPath, "utf8")) as ServiceAccountKey;
  }

  private buildJwt(key: ServiceAccountKey): string {
    const now = Math.floor(Date.now() / 1000);
    const encode = (obj: object): string => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const header = encode({ alg: "PS256", typ: "JWT", kid: key.id });
    const payload = encode({
      iss: key.service_account_id,
      aud: IAM_URL,
      iat: now,
      exp: now + 3600,
    });

    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${payload}`);
    const signature = signer.sign({
      key: key.private_key,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    });

    return `${header}.${payload}.${signature.toString("base64url")}`;
  }
}
