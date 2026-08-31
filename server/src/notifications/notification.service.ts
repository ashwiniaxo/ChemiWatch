import nodemailer from "nodemailer";

import type {
  CourseAvailability,
} from "../cheminot/cheminot.types.js";

export interface NotificationServiceConfig {
  emailUser: string;
  emailPassword: string;
  emailTo: string;
}

export class NotificationService {
  private transporter;

  constructor(
    private readonly config: NotificationServiceConfig,
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
  }

  async sendCourseAvailability(
    course: CourseAvailability,
  ): Promise<void> {
    const availableGroups = course.groups.filter(
      (group) => group.available,
    );

    if (availableGroups.length === 0) {
      return;
    }

    const groupText = availableGroups
      .map((group) => {
        const activities = group.activities
          .map(
            (activity) =>
              `${activity.label}: day ${activity.day}, ` +
              `${activity.startTime} - ${activity.endTime}`,
          )
          .join("\n");

        return [
          `Group ${group.number}`,
          `${group.availableSeats} seat(s) available`,
          `${group.enrolled}/${group.capacity}`,
          activities,
        ].join("\n");
      })
      .join("\n\n");

    await this.transporter.sendMail({
      from: this.config.emailUser,

      to: this.config.emailTo,

      subject:
        `🚨 ${course.code} - course availability detected`,

      text: [
        `ChemiWatch detected availability for ${course.code}.`,
        "",
        groupText,
        "",
        "Open ChemiNot as soon as possible to verify and register.",
      ].join("\n"),
    });

    console.log(
      `Email notification sent for ${course.code}`,
    );
  }
}
