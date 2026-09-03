/**
 * Periodically monitors course availability and detects status changes
 *
 * The service keeps the previous state of every watched course in memory.
 * Every five minutes, it compares the latest state with the previous one
 * and sends notifications when availability changes
 */

import cron from "node-cron";

import type { CourseAvailability } from "../cheminot/cheminot.types.js";

import { CourseService } from "../courses/course.service.js";
import { NotificationService } from "../notifications/notification.service.js";

export class MonitorService {
  private previousStates = new Map<string, CourseAvailability>();

  constructor(
    private readonly courseService: CourseService,
    private readonly notificationService: NotificationService,
    private readonly notifyOnStart = false,
  ) {}

  watch(courseCodes: string[]): void {
    console.log(`Monitoring courses: ${courseCodes.join(", ")}`);

    // Verification at the start of the application
    void this.checkAll(courseCodes);

    // Verification every 5 mins
    cron.schedule("*/5 * * * *", async () => {
      const timestamp = new Date().toLocaleString("fr-CA");

      console.log(`[${timestamp}] Checking course availability...`);

      await this.checkAll(courseCodes);
    });
  }

  private async checkAll(courseCodes: string[]): Promise<void> {
    for (const courseCode of courseCodes) {
      await this.checkCourse(courseCode);
    }
  }

  private async checkCourse(courseCode: string): Promise<void> {
    try {
      const current = await this.courseService.getCourseAvailability(courseCode);
      const previous = this.previousStates.get(courseCode);
      this.detectChanges(previous, current);
      this.previousStates.set(courseCode, current);
    } catch (error) {
      console.error(`Failed to check ${courseCode}:`, error);
    }
  }

  private detectChanges(
    previous: CourseAvailability | undefined,
    current: CourseAvailability,
  ): void {
    if (!previous) {
      console.log(`${current.code}: initial status = ${current.status}`);

      for (const group of current.groups) {
        console.log(
          `  Group ${group.number}: ` +
            `${group.enrolled}/${group.capacity} ` +
            `(${group.availableSeats} seat(s) available)`,
        );
      }

      if (this.notifyOnStart && current.status === "AVAILABLE") {
        console.log(`📧 Sending initial availability notification for ${current.code}`);

        void this.notificationService.sendCourseAvailability(current);
      }

      return;
    }

    // Case 1: the course was unavailable and is now available
    if (previous.status !== "AVAILABLE" && current.status === "AVAILABLE") {
      console.log(`🚨 ${current.code}: a group is now available!`);

      void this.notificationService.sendCourseAvailability(current);

      return;
    }

    // Case 2: the course was available and is now full
    if (previous.status === "AVAILABLE" && current.status !== "AVAILABLE") {
      console.log(`🔴 ${current.code}: no groups are available anymore.`);
      void this.notificationService.sendCourseFull(current.code);
      return;
    }

    // Case 3: the course remains available, so compare individual groups
    for (const currentGroup of current.groups) {
      const previousGroup = previous.groups.find((group) => group.number === currentGroup.number);

      // A group that was not previously offered is open now
      if (!previousGroup) {
        console.log(`🚨 ${current.code} group ${currentGroup.number} is now available!`);

        void this.notificationService.sendCourseAvailability(current);

        continue;
      }

      // A previously full group now has at least one available seat
      if (previousGroup.availableSeats === 0 && currentGroup.availableSeats > 0) {
        console.log(
          `🚨 ${current.code} group ${currentGroup.number}: ` +
            `${currentGroup.availableSeats} seat(s) available!`,
        );

        void this.notificationService.sendCourseAvailability(current);
      }

      // Log seat count changes even when no notification needs to be sent
      if (previousGroup.availableSeats !== currentGroup.availableSeats) {
        console.log(
          `${current.code} group ${currentGroup.number}: ` +
            `${previousGroup.availableSeats} → ` +
            `${currentGroup.availableSeats} available seat(s)`,
        );
      }
    }
  }
}
