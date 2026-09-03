/**
 * Main entry point for the ChemiWatch backend
 *
 * Responsibilities:
 * - Load environment configuration
 * - Start the persistent ChemiNot browser session
 * - Create and connect application services
 * - Start the course monitor
 * - Expose the Express HTTP API
 * - Gracefully close Playwright when the application stops
 */

import "dotenv/config";
import cors from "cors";
import express from "express";

import { CheminotClient } from "./cheminot/cheminot.client.js";
import { CourseService } from "./courses/course.service.js";
import { MonitorService } from "./monitoring/monitor.service.js";
import { NotificationService } from "./notifications/notification.service.js";
import { CheminotSession } from "./cheminot/cheminot.session.js";

const app = express();

const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const cheminotSession = new CheminotSession(
  getRequiredEnv("CHEMINOT_LOGIN_URL"),
  getRequiredEnv("CHEMINOT_BASE_URL"),
);
await cheminotSession.start(true);

const cheminotClient = new CheminotClient({
  baseUrl: getRequiredEnv("CHEMINOT_BASE_URL"),
  studentId: getRequiredEnv("CHEMINOT_STUDENT_ID"),
  programId: getRequiredEnv("CHEMINOT_PROGRAM_ID"),
  session: getRequiredEnv("CHEMINOT_SESSION"),
  concentration: getRequiredEnv("CHEMINOT_CONCENTRATION"),

  getToken: () => cheminotSession.getToken(),
  refreshToken: () => cheminotSession.refreshToken(),
});

const courseService = new CourseService(cheminotClient);

const notificationService = new NotificationService({
  emailUser: getRequiredEnv("EMAIL_USER"),
  emailPassword: getRequiredEnv("EMAIL_PASSWORD"),
  emailTo: getRequiredEnv("EMAIL_TO"),
});

const notifyOnStart = process.env.CHEMINOT_NOTIFY_ON_START === "true";

const monitorService = new MonitorService(courseService, notificationService, notifyOnStart);

const watchedCourses = (process.env.CHEMINOT_WATCH_COURSES ?? "")
  .split(",")
  .map((course) => course.trim().toUpperCase())
  .filter(Boolean);

if (watchedCourses.length > 0) {
  monitorService.watch(watchedCourses);
}

app.get("/", (_req, res) => {
  res.json({
    name: "ChemiWatch API",
    status: "running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/api/courses/:courseCode", async (req, res) => {
  try {
    const result = await courseService.getCourseAvailability(req.params.courseCode);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve course availability.",
    });
  }
});

async function shutdown(): Promise<void> {
  console.log("Shutting down ChemiWatch...");

  await cheminotSession.close();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

app.listen(PORT, () => {
  console.log(`ChemiWatch API running on http://localhost:${PORT}`);
});
