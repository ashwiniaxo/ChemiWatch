import cron from "node-cron";

import type {
  CourseAvailability,
} from "../cheminot/cheminot.types.js";

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
    console.log(
      `Monitoring courses: ${courseCodes.join(", ")}`,
    );

    // Verification immediatement au demarrage
    void this.checkAll(courseCodes);

    
    // Verification toutes les 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        
      const timestamp = new Date().toLocaleString("fr-CA");

    console.log(
    `[${timestamp}] Checking course availability...`,
    );

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
      const current =
        await this.courseService.getCourseAvailability(courseCode);

      const previous =
        this.previousStates.get(courseCode);

      this.detectChanges(previous, current);

      this.previousStates.set(courseCode, current);
    } catch (error) {
      console.error(
        `Failed to check ${courseCode}:`,
        error,
      );
    }
  }

  private detectChanges(
    previous: CourseAvailability | undefined,
    current: CourseAvailability,
  ): void {
    // Premier check
    if (!previous) {
        console.log(
            `${current.code}: initial status = ${current.status}`,
        );

        for (const group of current.groups) {
            console.log(
            `  Group ${group.number}: ` +
                `${group.enrolled}/${group.capacity} ` +
                `(${group.availableSeats} seat(s) available)`,
            );
        }

        if (
            this.notifyOnStart &&
            current.status === "AVAILABLE"
        ) {
            console.log(
            `📧 Sending initial availability notification for ${current.code}`,
            );

            void this.notificationService.sendCourseAvailability(
            current,
            );
        }

        return;
    }

    // Cas 1:
    // aucun groupe disponible avant
    // puis un groupe devient disponible
    if (
      previous.status !== "AVAILABLE" &&
      current.status === "AVAILABLE"
    ) {
      console.log(
        `🚨 ${current.code}: a group is now available!`,
      );

      void this.notificationService.sendCourseAvailability(current);

      return;
    }

    // Cas 2:
    // le cours était disponible avant
    // puis il devient complet / indisponible
    if (
    previous.status === "AVAILABLE" &&
    current.status !== "AVAILABLE"
    ) {
    console.log(
        `🔴 ${current.code}: no groups are available anymore.`,
    );

    void this.notificationService.sendCourseFull(
        current.code,
    );

    return;
    }

    // Cas 2:
    // comparer chaque groupe
    for (const currentGroup of current.groups) {
      const previousGroup = previous.groups.find(
        (group) =>
          group.number === currentGroup.number,
      );

      // Le groupe n'existait pas dans le resultat precedent
      if (!previousGroup) {
        console.log(
          `🚨 ${current.code} group ${currentGroup.number} is now available!`,
        );

        void this.notificationService.sendCourseAvailability(current);

        continue;
      }

      // Le groupe etait plein puis une place est apparue
      if (
        previousGroup.availableSeats === 0 &&
        currentGroup.availableSeats > 0
      ) {
        console.log(
          `🚨 ${current.code} group ${currentGroup.number}: ` +
            `${currentGroup.availableSeats} seat(s) available!`,
        );

        void this.notificationService.sendCourseAvailability(current);
      }

      // Optionnel:
      // loguer simplement un changement du nombre de places
      if (
        previousGroup.availableSeats !==
        currentGroup.availableSeats
      ) {
        console.log(
          `${current.code} group ${currentGroup.number}: ` +
            `${previousGroup.availableSeats} → ` +
            `${currentGroup.availableSeats} available seat(s)`,
        );
      }
    }
  }
}
