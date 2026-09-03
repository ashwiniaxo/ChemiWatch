/**
 * Converts raw ChemiNot API objects into ChemiWatch models
 */

import type { Activity, CheminotActivity, CheminotGroup, Group } from "./cheminot.types.js";

/**
 * Converts a ChemiNot activity into the ChemiWatch activity model
 */
export function mapActivity(activity: CheminotActivity): Activity {
  return {
    day: activity.Jour,
    startTime: activity.HeureDebut,
    endTime: activity.HeureFin,
    type: activity.Libelle,
    label: activity.Etiquette,
    remote: activity.OffertADistance,
  };
}

/**
 * Converts a ChemiNot group into the ChemiWatch group format
 *
 * Also calculates the number of remaining seats and whether the group
 * currently has availability.
 */
export function mapGroup(group: CheminotGroup): Group {
  // Calculate remaining seats while preventing negative values
  const availableSeats = Math.max(group.NbPlaces - group.NbInscrits, 0);

  return {
    number: group.NoGroupe,
    enrolled: group.NbInscrits,
    capacity: group.NbPlaces,
    availableSeats,
    available: availableSeats > 0,
    selected: group.Selectionne,
    inSchedule: group.EstDansHoraire,
    activities: group.Activites.map(mapActivity),
  };
}
