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

export type Estado = 'nueva' | 'en_proceso' | 'resuelta';
export type Prioridad = 'baja' | 'media' | 'alta';

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
}

export interface ImportSummary {
  escuelas_creadas: number;
  escuelas_actualizadas: number;
  secciones_creadas: number;
  secciones_actualizadas: number;
  total_escuelas_en_archivo: number;
  total_secciones_en_archivo: number;
}
