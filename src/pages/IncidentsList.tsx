import React, { useEffect, useState } from 'react';
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
];

const PRIORIDADES: { value: Prioridad | ''; label: string }[] = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const ESTADO_COLOR: Record<Estado, string> = {
  nueva: 'bg-blue-600',
  en_proceso: 'bg-amber-600',
  resuelta: 'bg-green-600',
};

const PRIORIDAD_COLOR: Record<Prioridad, string> = {
  baja: 'bg-slate-500',
  media: 'bg-violet-600',
  alta: 'bg-red-600',
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize text-white ${color}`}>{children}</span>;
}

interface Filters {
  estado: string;
  prioridad: string;
  tipo: string;
  q: string;
}

export default function IncidentsList() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [filters, setFilters] = useState<Filters>({ estado: '', prioridad: '', tipo: '', q: '' });
  const [page, setPage] = useState(1);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.incidentTypes().then((data) => setTypes(data.incident_types));
  }, []);

  async function load(pageToLoad = page) {
    setLoading(true);
    setError('');
    try {
      const data = await api.incidents({ ...filters, page: pageToLoad, pageSize: PAGE_SIZE });
      setIncidents(data.incidents);
      setTotal(data.total);
      setPage(pageToLoad);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.estado, filters.prioridad, filters.tipo]);

  async function handleUpdate(id: number, payload: { estado?: string; prioridad?: string }) {
    try {
      await api.updateIncident(id, payload);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-primary-dark">Incidencias ({total})</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="field-input"
          value={filters.tipo}
          onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
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
          onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
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
          onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
        >
          {PRIORIDADES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="field-input min-w-[220px] flex-1"
          placeholder="Buscar en descripción, docente, estudiantes…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
        />
        <button className="btn-primary" onClick={() => load(1)}>
          Buscar
        </button>
      </div>

      {error && <p className="font-medium text-red-600">{error}</p>}
      {loading && <p>Cargando…</p>}

      <div className="flex flex-col gap-3">
        {incidents.map((inc) => (
          <div key={inc.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <strong>{inc.tipo_nombre}</strong>
              <div className="flex gap-1.5">
                <Badge color={ESTADO_COLOR[inc.estado]}>{inc.estado.replace('_', ' ')}</Badge>
                <Badge color={PRIORIDAD_COLOR[inc.prioridad]}>{inc.prioridad}</Badge>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <strong>{inc.school_name}</strong>
                <span className="text-slate-400"> ({inc.school_code})</span>
                {inc.grade && ` · ${inc.grade}`}
                {inc.section_letter && ` · Sección ${inc.section_letter}`}
                {inc.class_period && ` · ${inc.class_period}`}
                {(inc.tipo_clase || inc.subject) && ` · ${inc.tipo_clase || 'Clase'} ${inc.subject || ''}`}
              </p>
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <strong className="text-slate-700">Motivo:</strong> {inc.descripcion}
              </p>
              {inc.docente_nombre && (
                <p>
                  <strong>Docente:</strong> {inc.docente_nombre}
                  {inc.docente_email && ` · ${inc.docente_email}`}
                  {inc.docente_telefono && ` · Tel: ${inc.docente_telefono}`}
                  {inc.docente_dui && ` · DUI: ${inc.docente_dui}`}
                </p>
              )}
              {inc.estudiantes && (
                <p>
                  <strong>Estudiantes:</strong> {inc.estudiantes}
                </p>
              )}
              {inc.contenido_detalle && (
                <p>
                  <strong>Contenido:</strong> {inc.contenido_detalle}
                </p>
              )}
              <p className="text-slate-500">
                Reportado por {inc.reportante_nombre || inc.reportante_email} el{' '}
                {new Date(inc.created_at).toLocaleString('es-SV')}
              </p>
            </div>
            {isAdmin && (
              <div className="mt-3 flex gap-2">
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
            )}
          </div>
        ))}
        {!loading && incidents.length === 0 && <p>No hay incidencias con estos filtros.</p>}
      </div>

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
            Página {page} de {totalPages} · {total} {total === 1 ? 'incidencia' : 'incidencias'}
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
