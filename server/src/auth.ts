/**
 * Interactive authentication utility for ChemiWatch
 *
 * Run with:
 *   npm run auth
 *
 * This opens a visible Chromium window so the user can sign in to ChemiNot
 * normally and complete Microsoft MFA. The authenticated browser profile is
 * then reused by the background ChemiWatch server
 */

import "dotenv/config";
import { CheminotSession } from "./cheminot/cheminot.session.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const session = new CheminotSession(
  getRequiredEnv("CHEMINOT_LOGIN_URL"),
  getRequiredEnv("CHEMINOT_BASE_URL"),
);

console.log("Opening ChemiNot authentication...");
console.log("Log in normally and complete MFA if requested.");

await session.start(false);

console.log("");
console.log("Once ChemiNot is fully loaded, return here.");
console.log("Press Ctrl+C when the login is complete.");

process.on("SIGINT", async () => {
  console.log("");
  console.log("Saving browser session...");

  await session.close();

  console.log("Session saved.");

  process.exit(0);
});
