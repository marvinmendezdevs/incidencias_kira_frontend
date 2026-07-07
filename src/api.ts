import type { AuthUser, School, Section, IncidentType, Incident, ImportSummary } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = (data && data.error) || `Error ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export interface CreateIncidentPayload {
  incident_type_id: number;
  school_code: string;
  section_id: number | null;
  descripcion: string;
  docente_nombre?: string | null;
  docente_email?: string | null;
  docente_telefono?: string | null;
  docente_dui?: string | null;
  estudiantes?: string | null;
  contenido_detalle?: string | null;
  prioridad?: string;
}

export interface UpdateIncidentPayload {
  estado?: string;
  prioridad?: string;
}

export interface IncidentsQuery {
  escuela?: string;
  tipo?: string;
  estado?: string;
  prioridad?: string;
  q?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

export const api = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  loginWithGoogle: (idToken: string) =>
    request<{ user: AuthUser }>('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  schools: (q = '') => request<{ schools: School[] }>(`/api/schools?q=${encodeURIComponent(q)}`),
  school: (code: string) => request<{ school: School }>(`/api/schools/${encodeURIComponent(code)}`),
  sections: (
    schoolCode: string,
    filters: { q?: string; grade?: string; sectionLetter?: string; classPeriod?: string; id?: string } = {}
  ) => {
    const params = new URLSearchParams({ schoolCode, ...filters } as Record<string, string>);
    return request<{ sections: Section[] }>(`/api/sections?${params.toString()}`);
  },

  incidentTypes: (includeInactive = false) =>
    request<{ incident_types: IncidentType[] }>(
      `/api/incident-types${includeInactive ? '?includeInactive=1' : ''}`
    ),
  createIncidentType: (payload: {
    nombre: string;
    categoria: string;
    descripcion: string | null;
    requiere_seccion: boolean;
  }) => request<{ incident_type: IncidentType }>('/api/incident-types', { method: 'POST', body: JSON.stringify(payload) }),
  toggleIncidentType: (id: number, activo: boolean) =>
    request<{ incident_type: IncidentType }>(`/api/incident-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    }),

  incidents: (params: IncidentsQuery = {}) => {
    const entries = Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const qs = new URLSearchParams(entries).toString();
    return request<{ incidents: Incident[]; total: number; page: number; pageSize: number }>(
      `/api/incidents?${qs}`
    );
  },
  incident: (id: number) => request<{ incident: Incident }>(`/api/incidents/${id}`),
  createIncident: (payload: CreateIncidentPayload) =>
    request<{ id: number }>('/api/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncident: (id: number, payload: UpdateIncidentPayload) =>
    request<{ incident: Incident }>(`/api/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  importSections: async (file: File): Promise<{ ok: boolean; summary: ImportSummary }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/sections/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al importar.');
    return data;
  },
};
