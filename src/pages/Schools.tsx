import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { School } from '../types';
import { SearchIcon, SchoolIcon, ChevronRightIcon } from '../components/icons';

export default function Schools() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .schools(query)
        .then((data) => setSchools(data.schools))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SchoolIcon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">¿Qué centro escolar vas a atender hoy?</h1>
        <p className="mt-1 text-slate-500">Busca por nombre o código para empezar.</p>
      </div>

      <div className="relative mx-auto mb-8 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          type="text"
          className="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none ring-primary/30 transition focus:border-primary focus:ring-4"
          placeholder="Nombre o código del centro escolar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className="mx-auto max-w-xl space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {schools.map((s) => (
            <button
              key={s.code}
              onClick={() => navigate(`/escuelas/${s.code}`)}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SchoolIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-800">{s.name}</span>
                <span className="text-sm text-slate-400">Código {s.code}</span>
              </span>
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-300 transition group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}

      {!loading && schools.length === 0 && (
        <p className="text-center text-slate-500">No se encontraron centros escolares con ese criterio.</p>
      )}
    </div>
  );
}
