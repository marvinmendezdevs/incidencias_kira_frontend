// Configura, por tipo de incidencia (segun su "nombre" en la base de datos),
// que campos mostrar en el formulario y como se llaman/que placeholder tienen.
// Esto evita mostrar siempre el mismo formulario generico sin importar el tipo.

export type FormMode =
  | 'simple' // solo un motivo/descripcion
  | 'estudiantes' // lista repetible de estudiantes ("+ Agregar estudiante")
  | 'estudiante_corregir' // un solo estudiante a corregir + que corregir
  | 'docente' // nombre de un docente + motivo
  | 'docente_cambio' // docente actual + secpercion/turno destino
  | 'contenido'; // el campo principal es el detalle de contenido

export interface IncidentFormConfig {
  mode: FormMode;
  motivoLabel: string;
  motivoPlaceholder: string;
  motivoRequired: boolean;
  estudiantesButtonLabel?: string;
  estudiantePlaceholder?: string;
  estudianteLabel?: string;
  docenteLabel?: string;
  docentePlaceholder?: string;
  destinoLabel?: string;
  destinoPlaceholder?: string;
  contenidoLabel?: string;
  contenidoPlaceholder?: string;
}

export const DEFAULT_FORM_CONFIG: IncidentFormConfig = {
  mode: 'simple',
  motivoLabel: 'Descripción',
  motivoPlaceholder: 'Describe la incidencia con el mayor detalle posible…',
  motivoRequired: true,
};

export const FORM_CONFIG_BY_NOMBRE: Record<string, IncidentFormConfig> = {
  'Faltan estudiantes en la sección': {
    mode: 'simple',
    motivoLabel: '¿Qué está pasando?',
    motivoPlaceholder: 'Ej. Solo hay 15 de 30 estudiantes matriculados en esta sección…',
    motivoRequired: true,
  },
  'Matricular estudiantes en la sección': {
    mode: 'estudiantes',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: 'Cualquier detalle adicional que ayude a matricularlos…',
    motivoRequired: false,
    estudiantesButtonLabel: '+ Agregar estudiante',
    estudiantePlaceholder: 'Nombre completo del estudiante',
  },
  'Eliminar estudiantes de una sección': {
    mode: 'estudiantes',
    motivoLabel: 'Motivo (opcional)',
    motivoPlaceholder: 'Ej. Se trasladaron a otra escuela, están duplicados…',
    motivoRequired: false,
    estudiantesButtonLabel: '+ Agregar estudiante a retirar',
    estudiantePlaceholder: 'Nombre completo del estudiante',
  },
  'Corregir datos de un estudiante': {
    mode: 'estudiante_corregir',
    motivoLabel: '¿Qué dato hay que corregir?',
    motivoPlaceholder: 'Ej. El correo está mal escrito, debería ser…',
    motivoRequired: true,
    estudianteLabel: 'Nombre del estudiante',
    estudiantePlaceholder: 'Nombre completo del estudiante',
  },
  'Falta docente en la sección': {
    mode: 'simple',
    motivoLabel: '¿Qué está pasando?',
    motivoPlaceholder: 'Ej. La sección no tiene ningún docente asignado desde hace 2 semanas…',
    motivoRequired: true,
  },
  'Cambiar docente de una sección a otra': {
    mode: 'docente_cambio',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: 'Cualquier detalle adicional…',
    motivoRequired: false,
    docenteLabel: 'Nombre del docente actual',
    docentePlaceholder: 'Nombre completo del docente',
    destinoLabel: '¿A qué sección/turno lo vas a mover?',
    destinoPlaceholder: 'Ej. 3er Grado, Sección B, Vespertino',
  },
  'Eliminar docente de una sección': {
    mode: 'docente',
    motivoLabel: 'Motivo',
    motivoPlaceholder: '¿Por qué hay que retirar a este docente de la sección?',
    motivoRequired: true,
    docenteLabel: 'Nombre del docente a retirar',
    docentePlaceholder: 'Nombre completo del docente',
  },
  'Docente con problemas de acceso a la plataforma': {
    mode: 'docente',
    motivoLabel: 'Describe el problema',
    motivoPlaceholder: 'Ej. El correo registrado en KIRA está mal escrito, debería ser…',
    motivoRequired: true,
    docenteLabel: 'Nombre del docente',
    docentePlaceholder: 'Nombre completo del docente',
  },
  'Agregar sección nueva': {
    mode: 'simple',
    motivoLabel: 'Describe la sección nueva',
    motivoPlaceholder: 'Grado, letra, turno y materia(s), y por qué hace falta…',
    motivoRequired: true,
  },
  'Eliminar sección': {
    mode: 'simple',
    motivoLabel: 'Motivo',
    motivoPlaceholder: '¿Por qué hay que eliminar esta sección?',
    motivoRequired: true,
  },
  'Contenido duplicado o no corresponde': {
    mode: 'contenido',
    contenidoLabel: '¿Qué pasa con el contenido?',
    contenidoPlaceholder: 'Ej. El contenido de Refuerzo Matemática es igual al de Clase Matemática…',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: '',
    motivoRequired: false,
  },
  'Falta contenido en la sección': {
    mode: 'contenido',
    contenidoLabel: '¿Qué contenido falta?',
    contenidoPlaceholder: 'Ej. No hay ninguna lección cargada para la unidad 3…',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: '',
    motivoRequired: false,
  },
  'Contenido con error': {
    mode: 'contenido',
    contenidoLabel: '¿Qué error tiene el contenido?',
    contenidoPlaceholder: 'Ej. La lección 4 tiene un error ortográfico en…',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: '',
    motivoRequired: false,
  },
};

export function getFormConfig(nombre: string | undefined): IncidentFormConfig {
  if (!nombre) return DEFAULT_FORM_CONFIG;
  return FORM_CONFIG_BY_NOMBRE[nombre] || DEFAULT_FORM_CONFIG;
}
