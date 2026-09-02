import type { CourseAvailability, Group } from "../cheminot/cheminot.types.js";

import { CheminotClient } from "../cheminot/cheminot.client.js";
import { mapGroup } from "../cheminot/cheminot.mapper.js";

export class CourseService {
  constructor(private readonly cheminotClient: CheminotClient) {}

  async getCourseAvailability(courseCode: string): Promise<CourseAvailability> {
    const normalizedCode = courseCode.trim().toUpperCase();

    const accessResponse = await this.cheminotClient.validateCourse(normalizedCode);

    if (accessResponse.length > 0) {
      const error = accessResponse[0];

      if (error.Error === 3) {
        return {
          code: normalizedCode,
          status: "NO_AVAILABLE_GROUPS",
          groups: [],
          message: error.Message,
        };
      }

      return {
        code: normalizedCode,
        status: "NOT_ACCESSIBLE",
        groups: [],
        message: error.Message,
      };
    }

    const offeredCourses = await this.cheminotClient.getOfferedGroups(normalizedCode);

    const course = offeredCourses.CoursOfferts.find((item) => item.Sigle === normalizedCode);

    if (!course) {
      return {
        code: normalizedCode,
        status: "NO_AVAILABLE_GROUPS",
        groups: [],
        message: offeredCourses.Message ?? "No available groups were found for this course.",
      };
    }

    const groups: Group[] = course.Groupes.map(mapGroup);

    return {
      code: normalizedCode,
      status: groups.length > 0 ? "AVAILABLE" : "NO_AVAILABLE_GROUPS",
      groups,
      ...(offeredCourses.Message ? { message: offeredCourses.Message } : {}),
    };
  }
}
