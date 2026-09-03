/**
 * HTTP client responsible for communicating with the ChemiNot API.
 *
 * - Sends authenticated requests to ChemiNot.
 * - Retrieves course access information.
 * - Retrieves currently offered groups.
 * - Retrieves the student's schedule.
 * - Automatically refreshes the authentication token after a 401 response.
 *
 * Authentication itself is handled by CheminotSession.
 */

import type {
  CheminotError,
  CheminotOfferedCoursesResponse,
  CheminotScheduleCourse,
} from "./cheminot.types.js";

/**
 * Configuration required by the ChemiNot API client
 *
 * Token retrieval is injected
 */
export interface CheminotClientConfig {
  baseUrl: string;
  studentId: string;
  programId: string;
  session: string;
  concentration: string;

  getToken: () => Promise<string>;
  refreshToken: () => Promise<string>;
}

/**
 * Provides typed methods for interacting with ChemiNot API endpoints.
 */
export class CheminotClient {
  constructor(private readonly config: CheminotClientConfig) {}

  /**
   * Executes an authenticated GET request to the ChemiNot API
   *
   * If the current token has expired, the session is refreshed and the
   * request is retried once.
   */
  private async get<T>(url: string): Promise<T> {
    let token = await this.config.getToken();

    let response = await this.request(url, token);

    // Retry the request with a refreshed token when authentication expires.
    if (response.status === 401) {
      console.log("ChemiNot token expired. Refreshing session...");

      token = await this.config.refreshToken();
      response = await this.request(url, token);
    }

    if (!response.ok) {
      throw new Error(`ChemiNot request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Sends a single authenticated HTTP request to ChemiNot.
   */
  private async request(url: string, token: string): Promise<Response> {
    return fetch(`${this.config.baseUrl}${url}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Checks whether a course can currently be selected by the student
   *
   * ChemiNot may return an error when all groups are full, closed,
   * or reserved for another department.
   */
  async validateCourse(courseCode: string): Promise<CheminotError[]> {
    const { studentId, programId, session, concentration } = this.config;

    // ChemiNot endpoint used to validate course selection access
    return this.get<CheminotError[]>(
      `/User/acces/selection-cours/${studentId}/programme/${programId}/cours/${courseCode}` +
        `?sessionInscr=${session}` +
        `&concentration=${concentration}` +
        `&estCoursAuChoix=false`,
    );
  }

  /**
   * Retrieves the groups that are currently available for a course.
   */
  async getOfferedGroups(courseCode: string): Promise<CheminotOfferedCoursesResponse> {
    const { studentId, programId, session } = this.config;

    // ChemiNot endpoint returning currently offered groups and their schedules
    return this.get<CheminotOfferedCoursesResponse>(
      `/CoursOfferts/${studentId}/programme/${programId}/cours/${courseCode}` +
        `?sessionInscr=${session}`,
    );
  }

  /**
   * Retrieves the student's current registered courses and schedule
   */
  async getSchedule(): Promise<CheminotScheduleCourse[]> {
    const { studentId, programId, session } = this.config;

    // ChemiNot endpoint returning the student's current schedule
    return this.get<CheminotScheduleCourse[]>(
      `/horaire/etudiant/${studentId}/programme/${programId}/horaire` + `?session=${session}`,
    );
  }
}
