import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { School } from '../types';
import { SearchIcon, SchoolIcon, ChevronRightIcon, ChevronLeftIcon } from '../components/icons';

const PAGE_SIZE = 5;

export default function Schools() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Si cambia la busqueda, siempre volvemos a la pagina 1 (si no, se puede
  // quedar "atascado" en una pagina que ya no existe para el nuevo filtro).
  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    setError('');
    // "cancelled" evita que una respuesta vieja (de lo que se escribio antes)
    // llegue tarde y reemplace los resultados de la busqueda actual.
    let cancelled = false;
    const handle = setTimeout(() => {
      api
        .schools(query, page, PAGE_SIZE)
        .then((data) => {
          if (cancelled) return;
          setSchools(data.schools);
          setTotal(data.total);
        })
        .catch(() => {
          if (cancelled) return;
          // Antes el error se perdia y se mostraba "No se encontraron
          // centros escolares", como si la busqueda no tuviera resultados.
          setSchools([]);
          setTotal(0);
          setError('Ocurrió un problema al cargar los centros escolares. Intenta de nuevo en unos momentos.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, page]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

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

      {!loading && error && (
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
          <p className="font-medium">{error}</p>
          <button
            className="mt-3 rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && schools.length === 0 && (
        <p className="text-center text-slate-500">No se encontraron centros escolares con ese criterio.</p>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4" /> Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {page} de {totalPages} · {total} {total === 1 ? 'escuela' : 'escuelas'}
          </span>
          <button
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
          >
            Siguiente <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
