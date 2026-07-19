/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  tags: string[]; // e.g., ["Som", "Câmera", "Mídia"]
  ministryIds: string[];
  photoUrl?: string;
  phone?: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  color: string;
  leaderId?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  ministryId: string;
  location?: string;
}

export interface Schedule {
  id: string;
  eventId: string;
  volunteerId: string;
  role: string;
  status: 'confirmed' | 'pending' | 'declined';
  startTime: Date; // Denormalized for conflict checking
  endTime: Date;   // Denormalized for conflict checking
}

export interface Conflict {
  volunteerId: string;
  schedules: Schedule[];
  overlapStart: Date;
  overlapEnd: Date;
}

export interface Song {
  id: string;
  church_id: string;
  title: string;
  artist?: string;
  key?: string;
  bpm?: number;
  lyrics_url?: string;
  video_url?: string;
  metadata?: any;
  created_at: string;
}

export interface ScheduleSong {
  id: string;
  schedule_id: string;
  song_id: string;
  order_index: number;
  notes?: string;
}
