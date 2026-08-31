import type {
  CheminotError,
  CheminotOfferedCoursesResponse,
  CheminotScheduleCourse,
} from "./cheminot.types.js";

const BASE_URL = "https://cheminotn.etsmtl.ca/api";

export interface CheminotClientConfig {
  studentId: string;
  programId: string;
  session: string;
  concentration: string;
  token: string;
}

export class CheminotClient {
  constructor(private readonly config: CheminotClientConfig) {}

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ChemiNot request failed: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  async validateCourse(courseCode: string): Promise<CheminotError[]> {
    const {
      studentId,
      programId,
      session,
      concentration,
    } = this.config;

    return this.get<CheminotError[]>(
      `/User/acces/selection-cours/${studentId}/programme/${programId}/cours/${courseCode}` +
        `?sessionInscr=${session}` +
        `&concentration=${concentration}` +
        `&estCoursAuChoix=false`,
    );
  }

  async getOfferedGroups(
    courseCode: string,
  ): Promise<CheminotOfferedCoursesResponse> {
    const {
      studentId,
      programId,
      session,
    } = this.config;

    return this.get<CheminotOfferedCoursesResponse>(
      `/CoursOfferts/${studentId}/programme/${programId}/cours/${courseCode}` +
        `?sessionInscr=${session}`,
    );
  }

  async getSchedule(): Promise<CheminotScheduleCourse[]> {
    const {
      studentId,
      programId,
      session,
    } = this.config;

    return this.get<CheminotScheduleCourse[]>(
      `/horaire/etudiant/${studentId}/programme/${programId}/horaire` +
        `?session=${session}`,
    );
  }
}
