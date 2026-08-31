import {
  chromium,
  type BrowserContext,
  type Page,
  type Request,
} from "playwright";

const CHEMINOT_URL =
  "https://cheminotn.etsmtl.ca/inscription";

export class CheminotSession {
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private token: string | null = null;

  // Empêche plusieurs refresh simultanés
  private refreshPromise: Promise<string> | null = null;

  async start(headless = true): Promise<void> {
    if (this.context) {
      return;
    }

    this.context =
      await chromium.launchPersistentContext(
        ".chemiwatch-profile",
        {
          headless,
        },
      );

    this.context.on("request", (request) => {
      this.captureToken(request);
    });

    this.page =
      this.context.pages()[0] ??
      (await this.context.newPage());

    await this.ensureCheminotPage();
  }

  private captureToken(request: Request): void {
    const url = request.url();

    if (!url.includes("cheminotn.etsmtl.ca/api/")) {
      return;
    }

    const authorization =
      request.headers()["authorization"];

    if (
      authorization &&
      authorization.startsWith("Bearer ")
    ) {
      this.token = authorization.slice(
        "Bearer ".length,
      );
    }
  }

  private async ensureCheminotPage(): Promise<void> {
    if (!this.page) {
      throw new Error(
        "ChemiNot browser page is not available.",
      );
    }

    const currentUrl = this.page.url();

    if (
      currentUrl.startsWith(
        "https://cheminotn.etsmtl.ca/",
      )
    ) {
      return;
    }

    try {
      await this.page.goto(CHEMINOT_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch (error) {
      // Certaines redirections Microsoft peuvent provoquer ERR_ABORTED
      // même si la navigation continue correctement.
      console.warn(
        "ChemiNot navigation was interrupted; checking resulting page...",
      );
    }
  }

  async getToken(): Promise<string> {
    if (!this.context || !this.page) {
      await this.start();
    }

    if (this.token) {
      return this.token;
    }

    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    // Si un refresh est déjà en cours,
    // les autres appels attendent le même résultat.
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise =
      this.performTokenRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    if (!this.page) {
      throw new Error(
        "ChemiNot browser session is not started.",
      );
    }

    this.token = null;

    console.log(
      "Refreshing ChemiNot authentication session...",
    );

    try {
      await this.page.goto(CHEMINOT_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch {
      console.warn(
        "Navigation interrupted during authentication refresh.",
      );
    }

    const token = await this.waitForToken(20000);

    if (token) {
      console.log(
        "ChemiNot authentication token acquired.",
      );

      return token;
    }

    throw new Error(
      "ChemiNot authentication required. Run `npm run auth` and sign in again.",
    );
  }

  private async waitForToken(
    timeoutMs: number,
  ): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (this.token) {
        return this.token;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );
    }

    return null;
  }

  async close(): Promise<void> {
    await this.context?.close();

    this.context = null;
    this.page = null;
    this.token = null;
    this.refreshPromise = null;
  }
}