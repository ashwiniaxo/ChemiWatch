import "dotenv/config";

import cors from "cors";
import express from "express";

import { CheminotClient } from "./cheminot/cheminot.client.js";
import { CourseService } from "./courses/course.service.js";
import { MonitorService } from "./monitoring/monitor.service.js";

const app = express();

const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`,
    );
  }

  return value;
}

const cheminotClient = new CheminotClient({
  studentId: getRequiredEnv("CHEMINOT_STUDENT_ID"),
  programId: getRequiredEnv("CHEMINOT_PROGRAM_ID"),
  session: getRequiredEnv("CHEMINOT_SESSION"),
  concentration: getRequiredEnv(
    "CHEMINOT_CONCENTRATION",
  ),
  token: getRequiredEnv("CHEMINOT_TOKEN"),
});

const courseService =
  new CourseService(cheminotClient);

const monitorService =
  new MonitorService(courseService);

const watchedCourses = (
  process.env.CHEMINOT_WATCH_COURSES ?? ""
)
  .split(",")
  .map((course) =>
    course.trim().toUpperCase(),
  )
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

app.get(
  "/api/courses/:courseCode",
  async (req, res) => {
    try {
      const result =
        await courseService.getCourseAvailability(
          req.params.courseCode,
        );

      res.json(result);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to retrieve course availability.",
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(
    `ChemiWatch API running on http://localhost:${PORT}`,
  );
});
