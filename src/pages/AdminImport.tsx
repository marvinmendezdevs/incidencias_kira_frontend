import React, { useState } from 'react';
import { api } from '../api';
import type { ImportSummary } from '../types';

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Selecciona el archivo sections.csv que te comparte el equipo de KIRA.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.importSections(file);
      setResult(data.summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const rows: [string, number][] = result
    ? [
        ['Escuelas en el archivo', result.total_escuelas_en_archivo],
        ['Escuelas nuevas (agregadas)', result.escuelas_creadas],
        ['Escuelas que ya existían (ignoradas)', result.escuelas_existentes],
        ['Secciones en el archivo', result.total_secciones_en_archivo],
        ['Secciones nuevas (agregadas)', result.secciones_creadas],
        ['Secciones que ya existían (ignoradas)', result.secciones_existentes],
      ]
    : [];

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-primary-dark">Importar catálogo de secciones</h2>
      <p className="mb-4 text-slate-600">
        Sube el archivo <code>sections.csv</code> más reciente que comparte KIRA. Solo se agregan las
        escuelas/secciones que todavía no existen — las que ya están cargadas se ignoran por completo (no se
        actualiza ni se borra nada).
      </p>
      <form onSubmit={handleSubmit} className="mb-5 flex items-center gap-3">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Importando…' : 'Importar'}
        </button>
      </form>

      {error && <p className="font-medium text-red-600">{error}</p>}

      {result && (
        <table className="w-full overflow-hidden rounded-xl bg-white shadow-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-slate-200 last:border-0">
                <td className="px-4 py-2.5">{label}</td>
                <td className="px-4 py-2.5 font-medium">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
