import type { Activity, CheminotActivity, CheminotGroup, Group } from "./cheminot.types.js";

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

export function mapGroup(group: CheminotGroup): Group {
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
