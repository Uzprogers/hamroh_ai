import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve("node_modules/simli-client/dist");
const pairs = [
  ["client.js", "Client.js"],
  ["client.d.ts", "Client.d.ts"],
];

for (const [source, target] of pairs) {
  const from = resolve(dir, source);
  const to = resolve(dir, target);
  if (!existsSync(from) || existsSync(to)) continue;
  copyFileSync(from, to);
  console.log(`simli-client: ${target} yaratildi`);
}
