/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Schedule, Conflict } from './types';

export function checkConflicts(newSchedule: Partial<Schedule>, allSchedules: Schedule[]): Conflict[] {
  if (!newSchedule.volunteerId || !newSchedule.startTime || !newSchedule.endTime) return [];

  const conflicts: Conflict[] = [];
  const volunteerSchedules = allSchedules.filter(s => s.volunteerId === newSchedule.volunteerId && s.id !== newSchedule.id);

  for (const existing of volunteerSchedules) {
    const hasOverlap = 
      newSchedule.startTime < existing.endTime && 
      newSchedule.endTime > existing.startTime;

    if (hasOverlap) {
      conflicts.push({
        volunteerId: newSchedule.volunteerId,
        schedules: [existing, newSchedule as Schedule],
        overlapStart: new Date(Math.max(newSchedule.startTime.getTime(), existing.startTime.getTime())),
        overlapEnd: new Date(Math.min(newSchedule.endTime.getTime(), existing.endTime.getTime())),
      });
    }
  }

  return conflicts;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
