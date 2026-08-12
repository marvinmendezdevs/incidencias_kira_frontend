import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Incident, IncidentType, Estado, Prioridad } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

const PAGE_SIZE = 5;

const ESTADOS: { value: Estado | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelta', label: 'Resuelta' },
  { value: 'no_aplica', label: 'No aplica' },
];

const PRIORIDADES: { value: Prioridad | ''; label: string }[] = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const TURNOS = [
  { value: '', label: 'Todos los turnos' },
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
];

const ESTADO_COLOR: Record<Estado, string> = {
  nueva: 'bg-blue-600',
  en_proceso: 'bg-amber-600',
  resuelta: 'bg-green-600',
  no_aplica: 'bg-slate-400',
};

const PRIORIDAD_COLOR: Record<Prioridad, string> = {
  baja: 'bg-slate-500',
  media: 'bg-violet-600',
  alta: 'bg-red-600',
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize text-white ${color}`}>
      {children}
    </span>
  );
}

interface Filters {
  estado: string;
  prioridad: string;
  tipo: string;
  turno: string;
  escuelaNombre: string;
  motivo: string;
  q: string;
}

const EMPTY_FILTERS: Filters = {
  estado: '',
  prioridad: '',
  tipo: '',
  turno: '',
  escuelaNombre: '',
  motivo: '',
  q: '',
};

export default function IncidentsList() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [exporting, setExporting] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState({ total: 0, analyzed: 0, pending: 0, ready: false });

  // Debounce ref para búsqueda en vivo
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.incidentTypes().then((data) => setTypes(data.incident_types));
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {
    load(1, EMPTY_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(pageToLoad = page, currentFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const [data, status] = await Promise.all([
        api.incidents({ ...currentFilters, page: pageToLoad, pageSize: PAGE_SIZE }),
        isAdmin
          ? api.incidentAnalysisStatus({ ...currentFilters, estado: 'nueva' })
          : Promise.resolve({ total: 0, analyzed: 0, pending: 0, ready: false }),
      ]);
      setIncidents(data.incidents);
      setTotal(data.total);
      setAnalysisStatus(status);
      setPage(pageToLoad);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Filtros de selección (dropdown) → recarga inmediata
  function setSelectFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    load(1, next);
  }

  // Campos de texto → debounce 400 ms
  function setTextFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, next), 400);
  }

  async function handleUpdate(id: number, payload: { estado?: string; prioridad?: string }) {
    try {
      await api.updateIncident(id, payload);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleBulkClassify() {
    setBulkAnalyzing(true);
    setError('');
    setBulkProgress('Preparando análisis…');
    let afterId = 0;
    let processed = 0;
    let failed = 0;
    let noAplica = 0;
    try {
      let hasMore = false;
      do {
        const result = await api.bulkClassifyNewIncidents({ ...filters, estado: 'nueva' }, afterId);
        processed += result.processed;
        failed += result.failed;
        noAplica += result.noAplica;
        afterId = result.nextAfterId;
        hasMore = result.hasMore;
        setBulkProgress(
          `Analizadas: ${processed} · Resultado No aplica: ${noAplica}${failed ? ` · Errores: ${failed}` : ''}`
        );
        if (result.halted) {
          const retryMessage = result.retryAt
            ? ` Intenta nuevamente a las ${new Date(result.retryAt).toLocaleTimeString('es-SV', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
              })}.`
            : '';
          throw new Error(
            `${result.errorReason || 'El análisis se detuvo por un error general de Gemini.'}${retryMessage}`
          );
        }
      } while (hasMore);
      await load(1, filters);
      setBulkProgress(
        `Análisis finalizado: ${processed} procesadas; ${noAplica} dieron como resultado No aplica${
          failed ? ` y ${failed} con error` : ''
        }.`
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBulkAnalyzing(false);
    }
  }

  async function handleExcelDownload() {
    setExporting(true);
    setError('');
    try {
      await api.downloadApplicableNewIncidents({ ...filters, estado: 'nueva' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    load(1, EMPTY_FILTERS);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary-dark">
          Incidencias{' '}
          <span className="text-base font-normal text-slate-400">({total})</span>
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-slate-400 hover:text-red-500"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Barra de búsqueda principal ── */}
      <div className="mb-3">
        <input
          type="text"
          className="field-input w-full"
          placeholder="Buscar por motivo, contenido, tipo de incidencia, nombre o correo del reportante…"
          value={filters.q}
          onChange={(e) => setTextFilter('q', e.target.value)}
        />
      </div>

      {/* ── Filtros rápidos (fila 1) ── */}
      <div className="mb-2 flex flex-wrap gap-2">
        <select
          className="field-input"
          value={filters.tipo}
          onChange={(e) => setSelectFilter('tipo', e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          className="field-input"
          value={filters.estado}
          onChange={(e) => setSelectFilter('estado', e.target.value)}
        >
          {ESTADOS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="field-input"
          value={filters.prioridad}
          onChange={(e) => setSelectFilter('prioridad', e.target.value)}
        >
          {PRIORIDADES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? 'Ocultar filtros ▲' : 'Más filtros ▼'}
        </button>
      </div>

      {/* ── Filtros avanzados ── */}
      {showAdvanced && (
        <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
          <select
            className="field-input"
            value={filters.turno}
            onChange={(e) => setSelectFilter('turno', e.target.value)}
          >
            {TURNOS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="field-input min-w-[200px] flex-1"
            placeholder="Filtrar por complejo educativo…"
            value={filters.escuelaNombre}
            onChange={(e) => setTextFilter('escuelaNombre', e.target.value)}
          />
          <input
            type="text"
            className="field-input min-w-[200px] flex-1"
            placeholder="Filtrar por motivo…"
            value={filters.motivo}
            onChange={(e) => setTextFilter('motivo', e.target.value)}
          />
        </div>
      )}

      {isAdmin && filters.estado === 'nueva' && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={bulkAnalyzing}
              onClick={handleBulkClassify}
            >
              {bulkAnalyzing ? 'Analizando nuevas…' : 'Analizar todas las nuevas con IA'}
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={bulkAnalyzing || exporting || !analysisStatus.ready}
              onClick={handleExcelDownload}
            >
              {exporting ? 'Generando Excel…' : 'Descargar Excel · Aplican y no aplican'}
            </button>
          </div>
          {bulkProgress && <p className="mt-2 text-sm text-slate-600">{bulkProgress}</p>}
          <p className="mt-2 text-sm text-slate-600">
            Analizadas: {analysisStatus.analyzed} de {analysisStatus.total}
            {analysisStatus.pending > 0 && ` · Pendientes: ${analysisStatus.pending}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            El análisis solo informa si aplica o no aplica y por qué; no modifica las incidencias. La descarga se habilita al finalizar todos los registros.
          </p>
        </div>
      )}

      {error && <p className="mb-2 font-medium text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Cargando…</p>}

      {/* ── Tarjetas de incidencias ── */}
      <div className="flex flex-col gap-3">
        {incidents.map((inc) => (
          <div key={inc.id} className="rounded-xl bg-white p-4 shadow-sm">

            {/* Encabezado: tipo + badges */}
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-800">{inc.tipo_nombre}</h3>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Badge color={ESTADO_COLOR[inc.estado]}>
                  {inc.estado.replace('_', ' ')}
                </Badge>
                <Badge color={PRIORIDAD_COLOR[inc.prioridad]}>{inc.prioridad}</Badge>
              </div>
            </div>

            {/* Metadata del aula */}
            <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="font-semibold">{inc.school_name}</p>
              <p className="text-xs text-slate-400">ID: {inc.school_code}</p>
              {(inc.grade || inc.section_letter || inc.class_period || inc.subject) && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {inc.grade && <span>Grado: <strong className="text-slate-700">{inc.grade}</strong></span>}
                  {inc.section_letter && <span>Sección: <strong className="text-slate-700">{inc.section_letter}</strong></span>}
                  {inc.class_period && <span>Turno: <strong className="text-slate-700">{inc.class_period}</strong></span>}
                  {(inc.tipo_clase || inc.subject) && (
                    <span>Clase: <strong className="text-slate-700">{[inc.tipo_clase, inc.subject].filter(Boolean).join(' – ')}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* Motivo */}
            <div className="mb-2 text-sm">
              <span className="font-semibold text-slate-700">Motivo: </span>
              <span className="text-slate-800">{inc.descripcion}</span>
            </div>

            {/* Contenido / Descripción */}
            {inc.contenido_detalle && (
              <div className="mb-2 text-sm">
                <span className="font-semibold text-slate-700">Contenido / Descripción: </span>
                <span className="text-slate-800">{inc.contenido_detalle}</span>
              </div>
            )}

            {/* Info complementaria (docente / estudiantes) */}
            {inc.docente_nombre && (
              <p className="mb-1 text-sm">
                <strong>Docente:</strong> {inc.docente_nombre}
                {inc.docente_email && ` · ${inc.docente_email}`}
                {inc.docente_telefono && ` · Tel: ${inc.docente_telefono}`}
                {inc.docente_dui && ` · DUI: ${inc.docente_dui}`}
              </p>
            )}
            {inc.estudiantes && (
              <p className="mb-1 text-sm">
                <strong>Estudiantes:</strong> {inc.estudiantes}
              </p>
            )}

            {/* Reportado por */}
            <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400">
              Reportado por{' '}
              <span className="font-medium text-slate-600">
                {inc.reportante_nombre || inc.reportante_email}
              </span>
              {inc.reportante_nombre && inc.reportante_email && (
                <> · <span>{inc.reportante_email}</span></>
              )}
              {' · '}
              {new Date(inc.created_at).toLocaleString('es-SV', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>

            {/* Dropdowns de admin */}
            {isAdmin && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm">
                  <strong className="text-indigo-900">Clasificación con IA</strong>

                  {inc.ai_classification && (
                    <div className="mt-2 text-slate-700">
                      <p>
                        <span className="font-bold text-indigo-800">
                          {inc.ai_classification === 'APLICA'
                            ? 'APLICA'
                            : inc.ai_classification === 'NO_APLICA'
                              ? 'NO APLICA'
                              : 'PENDIENTE DE NUEVO ANÁLISIS'}
                        </span>
                        {inc.ai_confidence != null && ` · ${Math.round(inc.ai_confidence * 100)}% de confianza`}
                      </p>
                      {inc.ai_incident_type && <p>Tipo sugerido: <strong>{inc.ai_incident_type}</strong></p>}
                      {inc.ai_reason && <p className="mt-1"><strong>Por qué:</strong> {inc.ai_reason}</p>}
                    </div>
                  )}
                  {!inc.ai_classification && (
                    <p className="mt-2 text-xs text-slate-500">
                      Pendiente de análisis mediante la acción general de incidencias nuevas.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                <select
                  className="field-input"
                  value={inc.estado}
                  onChange={(e) => handleUpdate(inc.id, { estado: e.target.value })}
                >
                  {ESTADOS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="field-input"
                  value={inc.prioridad}
                  onChange={(e) => handleUpdate(inc.id, { prioridad: e.target.value })}
                >
                  {PRIORIDADES.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && incidents.length === 0 && (
          <p className="text-center text-sm text-slate-400">No hay incidencias con estos filtros.</p>
        )}
      </div>

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => load(Math.max(page - 1, 1))}
            disabled={page <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4" /> Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages} · {total}{' '}
            {total === 1 ? 'incidencia' : 'incidencias'}
          </span>
          <button
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => load(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
          >
            Siguiente <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
