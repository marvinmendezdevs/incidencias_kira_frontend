import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Incident } from '../types';

type ResolutionStatus = 'en_proceso' | 'resuelta' | 'no_aplica';

const STATUS_LABEL: Record<ResolutionStatus, string> = {
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
  no_aplica: 'No aplica',
};

function parseIds(value: string) {
  return [...new Set((value.match(/\d+/g) || []).map(Number).filter((id) => id > 0))];
}

export default function ResolveIncidents() {
  const [idsText, setIdsText] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [missingIds, setMissingIds] = useState<number[]>([]);
  const [status, setStatus] = useState<ResolutionStatus>('en_proceso');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function search() {
    const ids = parseIds(idsText);
    if (ids.length === 0) {
      setError('Ingresa uno o más IDs separados por coma, espacio o salto de línea.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await api.incidentsByIds(ids);
      setIncidents(data.incidents);
      setMissingIds(data.missingIds);
      if (data.incidents.length === 0) setError('No se encontraron incidencias con esos IDs.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function applyStatus() {
    if (incidents.length === 0) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await api.updateIncidentsStatus(incidents.map((incident) => incident.id), status);
      setIncidents((current) => current.map((incident) => ({ ...incident, estado: status })));
      setMessage(`${result.updated} incidencia${result.updated === 1 ? '' : 's'} actualizada${result.updated === 1 ? '' : 's'} a “${STATUS_LABEL[status]}”.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-none -translate-x-1/2 sm:w-[80vw]">
      <Link to="/incidencias" className="mb-4 inline-block text-sm font-medium text-slate-500 hover:text-primary">
        ← Volver a incidencias
      </Link>
      <h2 className="text-xl font-bold text-primary-dark">Resolver incidencias</h2>
      <p className="mt-1 text-sm text-slate-600">Ingresa los IDs de las incidencias que deseas actualizar.</p>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <label className="field-label">
          IDs de incidencias
          <textarea
            className="field-input mt-1"
            rows={3}
            placeholder="Ejemplo: 12, 35, 48"
            value={idsText}
            onChange={(event) => setIdsText(event.target.value)}
          />
        </label>
        <button type="button" className="btn-primary mt-3" onClick={search} disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar incidencias'}
        </button>
      </div>

      {missingIds.length > 0 && <p className="mt-3 text-sm text-amber-700">No se encontraron los IDs: {missingIds.join(', ')}.</p>}
      {error && <p className="mt-3 font-medium text-red-600">{error}</p>}
      {message && <p className="mt-3 font-medium text-green-700">{message}</p>}

      {incidents.length > 0 && (
        <div className="mt-5 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="field-label min-w-[190px]">
              Acción a realizar
              <select className="field-input mt-1" value={status} onChange={(event) => setStatus(event.target.value as ResolutionStatus)}>
                {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="button" className="btn-primary" onClick={applyStatus} disabled={saving}>
              {saving ? 'Actualizando…' : `Aplicar a ${incidents.length} incidencia${incidents.length === 1 ? '' : 's'}`}
            </button>
          </div>

          <div className="max-h-[560px] overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-[1500px] w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Escuela</th>
                  <th className="px-3 py-2">Sección / turno</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Detalle</th>
                  <th className="px-3 py-2">Reportante</th>
                  <th className="px-3 py-2">Prioridad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-semibold">{incident.id}</td>
                    <td className="px-3 py-2">{incident.tipo_nombre}</td>
                    <td className="px-3 py-2"><strong>{incident.school_name}</strong><br /><span className="text-xs text-slate-500">{incident.school_code}</span></td>
                    <td className="px-3 py-2">{[incident.grade, incident.section_letter && `Sección ${incident.section_letter}`, incident.class_period, incident.subject].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="max-w-sm px-3 py-2">{incident.descripcion}</td>
                    <td className="max-w-sm px-3 py-2 whitespace-pre-line">{incident.contenido_detalle || incident.estudiantes || '—'}</td>
                    <td className="px-3 py-2">{incident.reportante_nombre || '—'}<br /><span className="text-xs text-slate-500">{incident.reportante_email || ''}</span></td>
                    <td className="px-3 py-2 capitalize">{incident.prioridad}</td>
                    <td className="px-3 py-2 capitalize">{incident.estado.replace('_', ' ')}</td>
                    <td className="whitespace-nowrap px-3 py-2">{new Date(incident.created_at).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
