import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { School, Section } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, PlusIcon } from '../components/icons';

function TurnoIcon({ period, className }: { period: string | null; className?: string }) {
  if ((period || '').toLowerCase() === 'vespertino') return <MoonIcon className={className} />;
  return <SunIcon className={className} />;
}

interface PhysicalGroup {
  key: string;
  sectionLetter: string | null;
  classPeriod: string | null;
  clases: Section[];
}

export default function SchoolSections() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError('');
    Promise.all([api.school(code), api.sections(code)])
      .then(([schoolData, sectionsData]) => {
        setSchool(schoolData.school);
        setSections(sectionsData.sections);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  // El backend ya ordena por grade/sectionLetter/subject/tipoClase. Aca
  // agrupamos en dos niveles: grado -> sección física (letra+turno) -> sus
  // clases (una por cada combinacion de materia/tipo: Clase, Refuerzo,
  // Remediación...), que es lo que una persona reconoce como "una sección"
  // con todo lo que tiene adentro.
  const byGrade = useMemo(() => {
    const grades = new Map<string, Map<string, PhysicalGroup>>();
    for (const s of sections) {
      const gradeKey = s.grade || 'Sin grado';
      if (!grades.has(gradeKey)) grades.set(gradeKey, new Map());
      const physGroups = grades.get(gradeKey)!;
      const physKey = `${s.section_letter || '—'}::${s.class_period || '—'}`;
      if (!physGroups.has(physKey)) {
        physGroups.set(physKey, {
          key: physKey,
          sectionLetter: s.section_letter,
          classPeriod: s.class_period,
          clases: [],
        });
      }
      physGroups.get(physKey)!.clases.push(s);
    }
    return grades;
  }, [sections]);

  function goToSection(s: Section) {
    const params = new URLSearchParams({ schoolCode: code || '', sectionId: String(s.id) });
    navigate(`/reportar?${params.toString()}`);
  }

  function goToNuevaSeccion() {
    navigate(`/reportar?schoolCode=${code}&nuevaSeccion=1`);
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Escuelas
      </Link>

      {loading && (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      )}
      {error && <p className="font-medium text-red-600">{error}</p>}

      {school && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-md">
          <div>
            <div className="text-sm text-blue-100">Centro escolar</div>
            <h1 className="text-xl font-bold">{school.name}</h1>
            <div className="text-sm text-blue-100">Código {school.code}</div>
          </div>
          <button
            onClick={goToNuevaSeccion}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-dark shadow-sm transition hover:bg-blue-50"
          >
            <PlusIcon className="h-4 w-4" /> Sección nueva
          </button>
        </div>
      )}

      {!loading && sections.length === 0 && !error && (
        <p className="text-slate-500">Esta escuela todavía no tiene secciones registradas en KIRA.</p>
      )}

      <div className="flex flex-col gap-8">
        {Array.from(byGrade.entries()).map(([grade, physGroups]) => (
          <div key={grade}>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary-dark">
                {grade}
              </span>
              <span className="text-xs text-slate-400">
                {physGroups.size} {physGroups.size === 1 ? 'sección' : 'secciones'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from(physGroups.values()).map((g) => (
                <div key={g.key} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-dark">
                      {g.sectionLetter || '—'}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                      <TurnoIcon period={g.classPeriod} className="h-3.5 w-3.5" />
                      {g.classPeriod || '—'}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {g.clases.length} {g.clases.length === 1 ? 'clase' : 'clases'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {g.clases.map((s, i) => (
                      <button
                        key={s.id}
                        onClick={() => goToSection(s)}
                        className={`group flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-primary/5 ${
                          i !== 0 ? 'border-t border-slate-100' : ''
                        }`}
                      >
                        <span className="flex-1 truncate text-sm text-slate-700">{s.class_name}</span>
                        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
