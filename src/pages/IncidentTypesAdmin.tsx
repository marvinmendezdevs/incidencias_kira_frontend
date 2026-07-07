import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { IncidentType, IncidentCategoria } from '../types';

const CATEGORIAS: IncidentCategoria[] = ['secciones', 'estudiantes', 'docentes', 'contenido', 'otro'];

export default function IncidentTypesAdmin() {
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<IncidentCategoria>('otro');
  const [descripcion, setDescripcion] = useState('');
  const [requiereSeccion, setRequiereSeccion] = useState(true);

  async function load() {
    try {
      const data = await api.incidentTypes(true);
      setTypes(data.incident_types);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createIncidentType({
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim() || null,
        requiere_seccion: requiereSeccion,
      });
      setNombre('');
      setDescripcion('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggle(t: IncidentType) {
    try {
      await api.toggleIncidentType(t.id, !t.activo);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-primary-dark">Tipos de incidencia</h2>

      <table className="mb-6 w-full overflow-hidden rounded-xl bg-white shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
            <th className="px-4 py-2.5">Nombre</th>
            <th className="px-4 py-2.5">Categoría</th>
            <th className="px-4 py-2.5">Requiere sección</th>
            <th className="px-4 py-2.5">Activo</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className={`border-b border-slate-100 last:border-0 ${t.activo ? '' : 'text-slate-400'}`}>
              <td className="px-4 py-2.5">{t.nombre}</td>
              <td className="px-4 py-2.5">{t.categoria}</td>
              <td className="px-4 py-2.5">{t.requiere_seccion ? 'Sí' : 'No'}</td>
              <td className="px-4 py-2.5">{t.activo ? 'Sí' : 'No'}</td>
              <td className="px-4 py-2.5">
                <button className="text-primary underline" onClick={() => handleToggle(t)}>
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mb-3 text-lg font-semibold text-primary-dark">Agregar nuevo tipo</h3>
      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
        <label className="field-label">
          Nombre
          <input
            type="text"
            className="field-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="field-label">
          Categoría
          <select
            className="field-input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as IncidentCategoria)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label sm:col-span-2">
          Descripción (opcional)
          <input type="text" className="field-input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={requiereSeccion}
            onChange={(e) => setRequiereSeccion(e.target.checked)}
          />
          Requiere seleccionar una sección
        </label>
        <button type="submit" className="btn-primary self-start sm:col-span-2">
          Crear tipo
        </button>
      </form>

      {error && <p className="mt-3 font-medium text-red-600">{error}</p>}
    </div>
  );
}
