import type {
  AiIncidenceClassification,
  AuthUser,
  ClasificacionIncidencia,
  School,
  Section,
  IncidentType,
  Incident,
  ImportSummary,
  ManagedUser,
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Token de sesion guardado en el navegador y enviado como
// "Authorization: Bearer <token>". Frontend y backend estan en dominios
// distintos, asi que la cookie de sesion es "de terceros" y algunos
// navegadores la bloquean (Chrome con cookies de terceros bloqueadas o
// perfiles administrados, Safari, Brave, incognito). Sin esto, el login
// parecia funcionar pero luego todo respondia 401 y la busqueda de centros
// escolares salia vacia. La cookie se sigue enviando como respaldo.
const TOKEN_KEY = 'incidencias_token';
export const SESSION_EXPIRED_EVENT = 'incidencias:session-expired';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Si el navegador no permite localStorage, queda solo la cookie.
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Si el backend responde 401 la sesion ya no sirve: se borra el token y se
// avisa a AuthContext para volver a la pantalla de login, en vez de mostrar
// resultados vacios como si no hubiera datos.
function handleUnauthorized(res: Response, path: string): void {
  if (res.status === 401 && path !== '/api/auth/google') {
    setAuthToken(null);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    handleUnauthorized(res, path);
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
  escuelaNombre?: string;
  tipo?: string;
  estado?: string;
  prioridad?: string;
  turno?: string;
  motivo?: string;
  q?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminUsersQuery {
  q?: string;
  role?: string;
  activo?: string;
  page?: number;
  pageSize?: number;
}

export const api = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  loginWithGoogle: (idToken: string) =>
    request<{ user: AuthUser; token?: string }>('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  schools: (q = '', page = 1, pageSize = 20) =>
    request<{ schools: School[]; total: number; page: number; pageSize: number }>(
      `/api/schools?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
    ),
  school: (code: string) => request<{ school: School }>(`/api/schools/${encodeURIComponent(code)}`),
  sections: (
    schoolCode: string,
    filters: {
      q?: string;
      grade?: string;
      sectionLetter?: string;
      classPeriod?: string;
      id?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries({ schoolCode, ...filters }).filter(([, v]) => v !== undefined && v !== '')
      ) as Record<string, string>
    );
    return request<{ sections: Section[]; total?: number; page?: number; pageSize?: number }>(
      `/api/sections?${params.toString()}`
    );
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
  incidentsByIds: (ids: number[]) =>
    request<{ incidents: Incident[]; missingIds: number[] }>('/api/incidents/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  updateIncidentsStatus: (ids: number[], estado: 'en_proceso' | 'resuelta' | 'no_aplica') =>
    request<{ updated: number }>('/api/incidents/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ ids, estado }),
    }),
  classifyIncident: (id: number) =>
    request<{ classification: AiIncidenceClassification }>(`/api/incidents/${id}/classify`, {
      method: 'POST',
    }),
  reviewIncidentClassification: (
    id: number,
    payload: {
      clasificacion: ClasificacionIncidencia;
      tipoIncidenciaId: number | null;
      motivo?: string;
    }
  ) =>
    request<{ ok: boolean }>(`/api/incidents/${id}/classification-review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  bulkClassifyNewIncidents: (filters: IncidentsQuery, afterId = 0, runId?: string) =>
    request<{
      processed: number;
      failed: number;
      noAplica: number;
      nextAfterId: number;
      hasMore: boolean;
      halted: boolean;
      errorReason: string | null;
      retryAt: string | null;
      runId: string;
    }>('/api/incidents/bulk-classify-new', {
      method: 'POST',
      body: JSON.stringify({ filters, afterId, runId, batchSize: 10 }),
    }),
  incidentAnalysisStatus: (filters: IncidentsQuery) => {
    const entries = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)] as [string, string]);
    return request<{
      total: number; analyzed: number; pending: number; ready: boolean;
      minimumPending: number; executionsToday: number; dailyLimit: number; remainingExecutions: number;
    }>(
      `/api/incidents/analysis-status?${new URLSearchParams(entries).toString()}`
    );
  },
  incidentAnalysisScheduleStatus: () =>
    request<{
      schedule: {
        enabled: boolean;
        running: boolean;
        nextRunAt: string;
        lastRunAt: string | null;
        lastProcessed: number;
        lastFailed: number;
        timeZone: string;
        scheduledHour: string;
      };
      totals: { total: number; analyzed: number; pending: number };
    }>('/api/incidents/analysis-schedule-status'),
  downloadApplicableNewIncidents: async (filters: IncidentsQuery) => {
    const entries = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)] as [string, string]);
    const response = await fetch(
      `${API_URL}/api/incidents/export-applicable-new?${new URLSearchParams(entries).toString()}`,
      { credentials: 'include', headers: authHeaders() }
    );
    if (!response.ok) {
      handleUnauthorized(response, '/api/incidents/export-applicable-new');
      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : null;
      throw new Error(data?.error || `Error ${response.status}`);
    }
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || 'analisis-incidencias.xlsx';
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  importSections: async (file: File): Promise<{ ok: boolean; summary: ImportSummary }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/sections/import`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) handleUnauthorized(res, '/api/admin/sections/import');
    if (!res.ok) throw new Error(data.error || 'Error al importar.');
    return data;
  },

  adminUsers: (params: AdminUsersQuery = {}) => {
    const entries = Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)] as [string, string]);
    const qs = new URLSearchParams(entries).toString();
    return request<{ users: ManagedUser[]; total: number; page: number; pageSize: number }>(
      `/api/admin/users${qs ? `?${qs}` : ''}`
    );
  },
  createAdminUser: (payload: { email: string; name?: string; role?: string }) =>
    request<{ user: ManagedUser }>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminUser: (id: number, payload: { activo?: boolean; role?: string }) =>
    request<{ user: ManagedUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};
