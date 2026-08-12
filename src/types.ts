export type Role = 'reportante' | 'administrador';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface School {
  code: string;
  name: string;
}

export interface Section {
  id: number;
  school_code: string;
  class_name: string;
  grade: string | null;
  track: string | null;
  subtrack: string | null;
  section_letter: string | null;
  tipo_clase: string | null;
  subject: string | null;
  class_period: string | null;
}

export type IncidentCategoria = 'secciones' | 'estudiantes' | 'docentes' | 'contenido' | 'otro';

export interface IncidentType {
  id: number;
  nombre: string;
  categoria: IncidentCategoria;
  descripcion: string | null;
  requiere_seccion: boolean;
  activo: boolean;
  orden: number;
}

// "no_aplica": para incidencias que no se pueden resolver.
export type Estado = 'nueva' | 'en_proceso' | 'resuelta' | 'no_aplica';
export type Prioridad = 'baja' | 'media' | 'alta';
export type ClasificacionIncidencia = 'APLICA' | 'NO_APLICA' | 'REQUIERE_REVISION';

export interface AiIncidenceClassification {
  clasificacion: ClasificacionIncidencia;
  tipoIncidenciaId: number | null;
  tipoIncidencia: string | null;
  confianza: number;
  motivo: string;
}

export interface Incident {
  id: number;
  incident_type_id: number;
  tipo_nombre: string;
  categoria: IncidentCategoria;
  school_code: string;
  school_name: string;
  section_id: number | null;
  class_name: string | null;
  grade: string | null;
  section_letter: string | null;
  tipo_clase: string | null;
  subject: string | null;
  class_period: string | null;
  descripcion: string;
  docente_nombre: string | null;
  docente_email: string | null;
  docente_telefono: string | null;
  docente_dui: string | null;
  estudiantes: string | null;
  contenido_detalle: string | null;
  prioridad: Prioridad;
  estado: Estado;
  reportante_nombre: string | null;
  reportante_email: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  ai_classification: ClasificacionIncidencia | null;
  ai_incident_type_id: number | null;
  ai_incident_type: string | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  ai_analyzed_at: string | null;
  ai_model: string | null;
  ai_reviewed: boolean;
  human_classification: ClasificacionIncidencia | null;
  human_incident_type_id: number | null;
  human_incident_type: string | null;
  human_reason: string | null;
  ai_reviewed_at: string | null;
}

export interface ImportSummary {
  escuelas_creadas: number;
  escuelas_existentes: number;
  secciones_creadas: number;
  secciones_existentes: number;
  total_escuelas_en_archivo: number;
  total_secciones_en_archivo: number;
}

export interface ManagedUser {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  activo: boolean;
  last_login_at: string | null;
  created_at: string;
}
