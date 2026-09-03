/**
 * Defines the data structures used by ChemiWatch.
 *
 * This file contains:
 * - Types matching the raw JSON returned by the ChemiNot API.
 * - Internal types used by the rest of this application.
 *
 */

// -----------------------------------------------------------------------------
// ChemiNot API
// It matches the JSON structure returned directly by ChemiNot
// -----------------------------------------------------------------------------

export interface CheminotError {
  Message: string;
  Title: string;
  Error: number;
}

export interface CheminotActivity {
  Jour: number;
  HeureDebut: string;
  HeureFin: string;
  TypeActivite: number;
  OffertADistance: boolean;
  Libelle: string;
  Etiquette: string;
}

export interface CheminotGroup {
  IdHoraire: number;
  NoGroupe: string;
  NbInscrits: number;
  NbPlaces: number;
  Selectionne: boolean;
  EstDansHoraire: boolean;
  MessageGroupe: string;
  Activites: CheminotActivity[];
}

export interface CheminotOfferedCourse {
  Sigle: string;
  Groupes: CheminotGroup[];
}

export interface CheminotOfferedCoursesResponse {
  CoursOfferts: CheminotOfferedCourse[];
  Message: string | null;
}

export interface CheminotScheduleCourse {
  Sigle: string;
  Groupe: string;
  EtatCours: string;
  Activites: CheminotActivity[];
}

// -----------------------------------------------------------------------------
// ChemiWatch internal types
// These types are used by this application
// -----------------------------------------------------------------------------

export interface Activity {
  day: number;
  startTime: string;
  endTime: string;
  type: string;
  label: string;
  remote: boolean;
}

export interface Group {
  number: string;
  enrolled: number;
  capacity: number;
  availableSeats: number;
  available: boolean;
  selected: boolean;
  inSchedule: boolean;
  activities: Activity[];
}

export type CourseAvailabilityStatus = "AVAILABLE" | "NO_AVAILABLE_GROUPS" | "NOT_ACCESSIBLE";

export interface CourseAvailability {
  code: string;
  status: CourseAvailabilityStatus;
  groups: Group[];
  message?: string;
}
