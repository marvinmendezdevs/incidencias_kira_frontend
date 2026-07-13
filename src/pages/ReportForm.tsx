import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { getFormConfig } from '../incidentFormConfig';
import { ChevronLeftIcon, PlusIcon, TrashIcon, SunIcon, MoonIcon } from '../components/icons';
import type { IncidentType, IncidentCategoria, School, Section } from '../types';

const CATEGORIA_LABEL: Record<IncidentCategoria, string> = {
  secciones: 'Secciones',
  estudiantes: 'Estudiantes',
  docentes: 'Docentes',
  contenido: 'Contenido',
  otro: 'Otro',
};

interface EstudianteEntry {
  nombre: string;
  nie: string;
}

function TurnoIcon({ period, className }: { period: string | null; className?: string }) {
  if ((period || '').toLowerCase() === 'vespertino') return <MoonIcon className={className} />;
  return <SunIcon className={className} />;
}

export default function ReportForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const schoolCode = searchParams.get('schoolCode') || '';
  const sectionId = searchParams.get('sectionId') || '';
  const nuevaSeccion = searchParams.get('nuevaSeccion') === '1';

  const [school, setSchool] = useState<School | null>(null);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [typeId, setTypeId] = useState('');
  const [selectedClass, setSelectedClass] = useState<Section | null>(null);
  const [classLoading, setClassLoading] = useState(false);

  // Campos genericos que despues se mapean segun el "mode" del tipo elegido.
  const [motivo, setMotivo] = useState('');
  const [estudiantesList, setEstudiantesList] = useState<EstudianteEntry[]>([{ nombre: '', nie: '' }]);
  const [estudianteNombre, setEstudianteNombre] = useState('');
  const [estudianteNie, setEstudianteNie] = useState('');
  const [docenteNombre, setDocenteNombre] = useState('');
  const [docenteEmail, setDocenteEmail] = useState('');
  const [docenteTelefono, setDocenteTelefono] = useState('');
  const [docenteDui, setDocenteDui] = useState('');
  const [destino, setDestino] = useState('');
  const [contenidoDetalle, setContenidoDetalle] = useState('');
  const [prioridad, setPrioridad] = useState('media');

  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!schoolCode) return;
    api.school(schoolCode).then((data) => setSchool(data.school)).catch(() => setSchool(null));
  }, [schoolCode]);

  useEffect(() => {
    api.incidentTypes().then((data) => setTypes(data.incident_types));
  }, []);

  // La sección física ya viene identificada por su id desde la lista plana
  // de "Secciones" (un item = un class_name), asi que aca solo hace falta
  // traer esa sección puntual — ya no hace falta desambiguar con un modal.
  useEffect(() => {
    if (nuevaSeccion || !schoolCode || !sectionId) {
      setSelectedClass(null);
      return;
    }
    setClassLoading(true);
    api
      .sections(schoolCode, { id: sectionId })
      .then((data) => setSelectedClass(data.sections[0] || null))
      .catch(() => setSelectedClass(null))
      .finally(() => setClassLoading(false));
  }, [nuevaSeccion, schoolCode, sectionId]);

  // "Crear sección" es el UNICO tipo pensado para el flujo de "sección
  // nueva" (cuando todavia no existe la sección en KIRA, asi que no hay
  // seccion que seleccionar). Los tipos de contenido tambien tienen
  // requiere_seccion: false (no exigen amarrar una seccion puntual), pero
  // SI se reportan desde una seccion existente, igual que "Eliminar
  // sección" y "Agregar lista de estudiantes". Por eso no podemos filtrar
  // solo por requiere_seccion: separamos explicitamente por nombre.
  const availableTypes = useMemo(
    () =>
      nuevaSeccion
        ? types.filter((t) => t.nombre === 'Crear sección')
        : types.filter((t) => t.nombre !== 'Crear sección'),
    [types, nuevaSeccion]
  );

  useEffect(() => {
    if (nuevaSeccion && availableTypes.length === 1) setTypeId(String(availableTypes[0].id));
  }, [nuevaSeccion, availableTypes]);

  const selectedType = useMemo(() => types.find((t) => String(t.id) === String(typeId)), [types, typeId]);
  const formConfig = useMemo(() => getFormConfig(selectedType?.nombre), [selectedType]);
  const isDocenteMode = formConfig.mode === 'docente' || formConfig.mode === 'docente_cambio';

  const grouped = useMemo(() => {
    const groups: Partial<Record<IncidentCategoria, IncidentType[]>> = {};
    for (const t of availableTypes) {
      groups[t.categoria] = groups[t.categoria] || [];
      groups[t.categoria]!.push(t);
    }
    return groups;
  }, [availableTypes]);

  function resetFormKeepContext() {
    setTypeId(nuevaSeccion && availableTypes.length === 1 ? String(availableTypes[0].id) : '');
    setMotivo('');
    setEstudiantesList([{ nombre: '', nie: '' }]);
    setEstudianteNombre('');
    setEstudianteNie('');
    setDocenteNombre('');
    setDocenteEmail('');
    setDocenteTelefono('');
    setDocenteDui('');
    setDestino('');
    setContenidoDetalle('');
    setPrioridad('media');
  }

  function updateEstudiante(index: number, field: keyof EstudianteEntry, value: string) {
    setEstudiantesList((list) => list.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }
  function addEstudiante() {
    setEstudiantesList((list) => [...list, { nombre: '', nie: '' }]);
  }
  function removeEstudiante(index: number) {
    setEstudiantesList((list) =>
      list.length > 1 ? list.filter((_, i) => i !== index) : [{ nombre: '', nie: '' }]
    );
  }

  function validate(): string | null {
    if (!typeId) return 'Selecciona un tipo de incidencia.';
    if (selectedType?.requiere_seccion && !selectedClass) return 'No se pudo identificar la sección. Vuelve a intentarlo desde la lista de secciones.';

    switch (formConfig.mode) {
      case 'estudiantes': {
        const conAlgo = estudiantesList.filter((e) => e.nombre.trim() || e.nie.trim());
        if (conAlgo.length === 0) return 'Agrega al menos un estudiante (nombre y NIE).';
        if (conAlgo.some((e) => !e.nombre.trim() || !e.nie.trim())) {
          return 'Completa el nombre y el NIE de cada estudiante que agregaste.';
        }
        // Este tipo es solo para listas grandes (11+); con menos, el centro
        // escolar lo puede hacer directamente en KIRA sin pasar por aca.
        const minimo = formConfig.estudiantesMinimo ?? 1;
        if (conAlgo.length < minimo) {
          return (
            formConfig.estudiantesHint ||
            `Agrega al menos ${minimo} estudiantes (llevas ${conAlgo.length}).`
          );
        }
        break;
      }
      case 'estudiante_corregir':
        if (!estudianteNombre.trim()) return 'Escribe el nombre del estudiante.';
        if (!estudianteNie.trim()) return 'Escribe el NIE del estudiante.';
        if (formConfig.motivoRequired && !motivo.trim()) return `Completa: ${formConfig.motivoLabel.toLowerCase()}.`;
        break;
      case 'docente':
        if (!docenteNombre.trim()) return 'Escribe el nombre del docente.';
        if (formConfig.motivoRequired && !motivo.trim()) return `Completa: ${formConfig.motivoLabel.toLowerCase()}.`;
        break;
      case 'docente_cambio':
        if (!docenteNombre.trim()) return 'Escribe el nombre del docente actual.';
        if (!destino.trim()) return 'Escribe a qué sección/turno lo vas a mover.';
        break;
      case 'contenido':
        if (!contenidoDetalle.trim()) return `Completa: ${formConfig.contenidoLabel?.toLowerCase()}.`;
        break;
      default:
        if (formConfig.motivoRequired && !motivo.trim()) return 'Completa la descripción.';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const validationError = validate();
    if (validationError) {
      setStatus({ ok: false, message: validationError });
      return;
    }

    let payload = {
      incident_type_id: Number(typeId),
      school_code: schoolCode,
      section_id: selectedClass ? selectedClass.id : null,
      descripcion: motivo.trim(),
      docente_nombre: null as string | null,
      docente_email: null as string | null,
      docente_telefono: null as string | null,
      docente_dui: null as string | null,
      estudiantes: null as string | null,
      contenido_detalle: null as string | null,
      prioridad,
    };

    if (isDocenteMode) {
      payload.docente_nombre = docenteNombre.trim();
      payload.docente_email = docenteEmail.trim() || null;
      payload.docente_telefono = docenteTelefono.trim() || null;
      payload.docente_dui = docenteDui.trim() || null;
    }

    switch (formConfig.mode) {
      case 'estudiantes': {
        const filas = estudiantesList.filter((e) => e.nombre.trim() && e.nie.trim());
        payload.estudiantes = filas.map((e) => `${e.nombre.trim()} (NIE: ${e.nie.trim()})`).join('\n');
        payload.descripcion = motivo.trim() || `${filas.length} estudiante(s)`;
        break;
      }
      case 'estudiante_corregir':
        payload.estudiantes = `${estudianteNombre.trim()} (NIE: ${estudianteNie.trim()})`;
        break;
      case 'docente_cambio':
        payload.contenido_detalle = `Destino: ${destino.trim()}`;
        payload.descripcion = motivo.trim() || `Mover a ${destino.trim()}`;
        break;
      case 'contenido':
        payload.contenido_detalle = contenidoDetalle.trim();
        payload.descripcion = motivo.trim() || (formConfig.contenidoLabel || 'Incidencia de contenido');
        break;
      default:
        break;
    }

    setSubmitting(true);
    try {
      await api.createIncident(payload);
      setStatus({ ok: true, message: 'Incidencia reportada correctamente.' });
      resetFormKeepContext();
    } catch (err) {
      setStatus({ ok: false, message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  if (!schoolCode) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="mb-3 text-slate-600">Primero elige un centro escolar.</p>
        <Link to="/" className="btn-primary inline-block">
          Ir a Escuelas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/escuelas/${schoolCode}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Secciones
      </Link>

      <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-400">Estás reportando en</div>
        <div className="text-lg font-bold text-slate-800">{school?.name || schoolCode}</div>
        {!nuevaSeccion ? (
          <div className="mt-2">
            {classLoading && <span className="text-sm text-slate-400">Buscando la sección…</span>}
            {!classLoading && selectedClass && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark">
                <TurnoIcon period={selectedClass.class_period} className="h-3.5 w-3.5" />
                {selectedClass.class_name}
              </span>
            )}
            {!classLoading && !selectedClass && (
              <span className="text-sm text-red-600">
                No se encontró esta sección. Vuelve a{' '}
                <Link to={`/escuelas/${schoolCode}`} className="underline">
                  la lista de secciones
                </Link>
                .
              </span>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
              Sección nueva (todavía no existe en KIRA)
            </span>
          </div>
        )}
      </div>

      <form className="flex flex-col rounded-2xl bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <label className="field-label mb-3">
          Tipo de incidencia
          <select className="field-input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">— Selecciona un tipo —</option>
            {(Object.entries(grouped) as [IncidentCategoria, IncidentType[]][]).map(([categoria, items]) => (
              <optgroup key={categoria} label={CATEGORIA_LABEL[categoria] || categoria}>
                {items.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {selectedType && (
          <>
            {/* --- Campos segun el tipo elegido --- */}
            {formConfig.mode === 'estudiantes' && (
              <div className="mb-3">
                <div className="field-label mb-1">Estudiantes (nombre y NIE)</div>
                {formConfig.estudiantesHint && (
                  <p className="mb-2 text-xs text-slate-500">{formConfig.estudiantesHint}</p>
                )}
                <div className="flex flex-col gap-2">
                  {estudiantesList.map((entry, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        className="field-input flex-[2]"
                        placeholder={formConfig.estudiantePlaceholder}
                        value={entry.nombre}
                        onChange={(e) => updateEstudiante(i, 'nombre', e.target.value)}
                      />
                      <input
                        type="text"
                        className="field-input flex-1"
                        placeholder="NIE"
                        value={entry.nie}
                        onChange={(e) => updateEstudiante(i, 'nie', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeEstudiante(i)}
                        className="rounded-md border border-slate-200 px-2.5 text-slate-400 hover:border-red-300 hover:text-red-500"
                        aria-label="Quitar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEstudiante}
                  className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <PlusIcon className="h-4 w-4" /> {formConfig.estudiantesButtonLabel || 'Agregar estudiante'}
                </button>
                {formConfig.estudiantesMinimo && (
                  <p className="mt-1 text-xs text-slate-400">
                    Llevas {estudiantesList.filter((e) => e.nombre.trim() || e.nie.trim()).length} de{' '}
                    {formConfig.estudiantesMinimo} estudiantes mínimo.
                  </p>
                )}
              </div>
            )}

            {formConfig.mode === 'estudiante_corregir' && (
              <div className="mb-3 flex gap-2">
                <label className="field-label flex-[2]">
                  {formConfig.estudianteLabel}
                  <input
                    type="text"
                    className="field-input"
                    value={estudianteNombre}
                    onChange={(e) => setEstudianteNombre(e.target.value)}
                    placeholder={formConfig.estudiantePlaceholder}
                  />
                </label>
                <label className="field-label flex-1">
                  NIE
                  <input
                    type="text"
                    className="field-input"
                    value={estudianteNie}
                    onChange={(e) => setEstudianteNie(e.target.value)}
                    placeholder="NIE"
                  />
                </label>
              </div>
            )}

            {isDocenteMode && (
              <div className="mb-3 flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <label className="field-label">
                  {formConfig.docenteLabel}
                  <input
                    type="text"
                    className="field-input"
                    value={docenteNombre}
                    onChange={(e) => setDocenteNombre(e.target.value)}
                    placeholder={formConfig.docentePlaceholder}
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="field-label">
                    Correo (KIRA)
                    <input
                      type="email"
                      className="field-input"
                      value={docenteEmail}
                      onChange={(e) => setDocenteEmail(e.target.value)}
                      placeholder="nombre.docente@clases.edu.sv"
                    />
                  </label>
                  <label className="field-label">
                    Teléfono
                    <input
                      type="text"
                      className="field-input"
                      value={docenteTelefono}
                      onChange={(e) => setDocenteTelefono(e.target.value)}
                      placeholder="7000-0000"
                    />
                  </label>
                  <label className="field-label">
                    DUI
                    <input
                      type="text"
                      className="field-input"
                      value={docenteDui}
                      onChange={(e) => setDocenteDui(e.target.value)}
                      placeholder="00000000-0"
                    />
                  </label>
                </div>
              </div>
            )}

            {formConfig.mode === 'docente_cambio' && (
              <label className="field-label mb-3">
                {formConfig.destinoLabel}
                <input
                  type="text"
                  className="field-input"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder={formConfig.destinoPlaceholder}
                />
              </label>
            )}

            {formConfig.mode === 'contenido' && (
              <label className="field-label mb-3">
                {formConfig.contenidoLabel}
                <textarea
                  className="field-input"
                  rows={4}
                  value={contenidoDetalle}
                  onChange={(e) => setContenidoDetalle(e.target.value)}
                  placeholder={formConfig.contenidoPlaceholder}
                />
              </label>
            )}

            {/* --- Motivo/descripcion: siempre presente, con label/placeholder segun el tipo --- */}
            <label className="field-label mb-3">
              {formConfig.motivoLabel}
              <textarea
                className="field-input"
                rows={formConfig.mode === 'simple' ? 4 : 2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={formConfig.motivoPlaceholder}
              />
            </label>

            <label className="field-label mb-4">
              Prioridad
              <select className="field-input" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </label>
          </>
        )}

        <button type="submit" className="btn-primary self-start" disabled={submitting || !selectedType}>
          {submitting ? 'Enviando…' : 'Reportar incidencia'}
        </button>

        {status && (
          <div className="mt-4">
            <p className={`font-medium ${status.ok ? 'text-green-700' : 'text-red-600'}`}>{status.message}</p>
            {status.ok && (
              <div className="mt-2 flex gap-3 text-sm">
                <button type="button" onClick={() => setStatus(null)} className="text-primary underline">
                  Reportar otra en esta sección
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/escuelas/${schoolCode}`)}
                  className="text-primary underline"
                >
                  Volver a secciones
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
