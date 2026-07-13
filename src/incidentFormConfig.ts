// Configura, por tipo de incidencia (segun su "nombre" en la base de datos),
// que campos mostrar en el formulario y como se llaman/que placeholder tienen.
// Esto evita mostrar siempre el mismo formulario generico sin importar el tipo.
//
// Solo hace falta configuracion para los tipos ACTIVOS (los que de verdad se
// pueden reportar); los desactivados nunca llegan al formulario, asi que no
// necesitan entrada aca.

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
  estudiantesMinimo?: number;
  estudiantesHint?: string;
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
  'Agregar lista de estudiantes': {
    mode: 'estudiantes',
    motivoLabel: 'Nota adicional (opcional)',
    motivoPlaceholder: 'Cualquier detalle adicional que ayude a matricularlos…',
    motivoRequired: false,
    estudiantesButtonLabel: '+ Agregar estudiante',
    estudiantePlaceholder: 'Nombre completo del estudiante',
    estudiantesMinimo: 25,
    estudiantesHint:
      'Este tipo es solo para listas de 25 estudiantes o más. Si son menos de 25, el centro escolar puede matricularlos directamente en KIRA.',
  },
  'Crear sección': {
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
