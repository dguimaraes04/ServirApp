/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Volunteer, Ministry, Event, Schedule } from './types';

export const MOCK_VOLUNTEERS: Volunteer[] = [
  {
    id: 'v1',
    name: 'Daniel Guimarães',
    email: 'daniel@example.com',
    tags: ['Som', 'Mídia', 'Câmera'],
    ministryIds: ['m1', 'm2'],
    phone: '(11) 98765-4321',
  },
  {
    id: 'v2',
    name: 'Ana Silva',
    email: 'ana@example.com',
    tags: ['Recepção', 'Infantil'],
    ministryIds: ['m3', 'm4'],
  },
  {
    id: 'v3',
    name: 'Lucas Oliveira',
    email: 'lucas@example.com',
    tags: ['Louvor', 'Violão', 'Voz'],
    ministryIds: ['m2'],
  },
  {
    id: 'v4',
    name: 'Maria Santos',
    email: 'maria@example.com',
    tags: ['Mídia', 'Projeção'],
    ministryIds: ['m1'],
  },
];

export const MOCK_MINISTRIES: Ministry[] = [
  {
    id: 'm1',
    name: 'Mídia',
    description: 'Responsável pela projeção, transmissão e redes sociais.',
    color: '#3B82F6',
  },
  {
    id: 'm2',
    name: 'Louvor',
    description: 'Equipe de música e adoração.',
    color: '#8B5CF6',
  },
  {
    id: 'm3',
    name: 'Recepção',
    description: 'Boas-vindas e organização do templo.',
    color: '#10B981',
  },
  {
    id: 'm4',
    name: 'Infantil',
    description: 'Cuidado e ensino para as crianças.',
    color: '#F59E0B',
  },
];

const now = new Date();
const nextSunday = new Date(now);
nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
nextSunday.setHours(18, 0, 0, 0);

const nextSundayEnd = new Date(nextSunday);
nextSundayEnd.setHours(20, 0, 0, 0);

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Culto de Celebração',
    startTime: nextSunday,
    endTime: nextSundayEnd,
    ministryId: 'm1',
    location: 'Templo Principal',
  },
  {
    id: 'e2',
    title: 'Culto de Celebração',
    startTime: nextSunday,
    endTime: nextSundayEnd,
    ministryId: 'm2',
    location: 'Templo Principal',
  }
];

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: 's1',
    eventId: 'e1',
    volunteerId: 'v1',
    role: 'Câmera 1',
    status: 'confirmed',
    startTime: nextSunday,
    endTime: nextSundayEnd,
  },
  {
    id: 's2',
    eventId: 'e2',
    volunteerId: 'v3',
    role: 'Violão',
    status: 'pending',
    startTime: nextSunday,
    endTime: nextSundayEnd,
  }
];
