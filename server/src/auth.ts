import { CheminotSession } from "./cheminot/cheminot.session.js";

const session = new CheminotSession();

console.log("Opening ChemiNot authentication...");
console.log(
  "Log in normally and complete MFA if requested.",
);

await session.start(false);

console.log("");
console.log(
  "Once ChemiNot is fully loaded, return here.",
);
console.log(
  "Press Ctrl+C when the login is complete.",
);

process.on("SIGINT", async () => {
  console.log("");
  console.log("Saving browser session...");

  await session.close();

  console.log("Session saved.");

  process.exit(0);
});