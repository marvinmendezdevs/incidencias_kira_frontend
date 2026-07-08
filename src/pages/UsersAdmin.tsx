import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { ManagedUser, Role } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

const PAGE_SIZE = 5;

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activoFilter, setActivoFilter] = useState('');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('reportante');
  const [creating, setCreating] = useState(false);

  // Si cambia cualquier filtro, volvemos a la pagina 1.
  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, activoFilter]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const handle = setTimeout(() => {
      api
        .adminUsers({ q: query, role: roleFilter, activo: activoFilter, page, pageSize: PAGE_SIZE })
        .then((data) => {
          setUsers(data.users);
          setTotal(data.total);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, roleFilter, activoFilter, page]);

  async function reload() {
    try {
      const data = await api.adminUsers({ q: query, role: roleFilter, activo: activoFilter, page, pageSize: PAGE_SIZE });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.createAdminUser({ email: email.trim(), name: name.trim() || undefined, role });
      setEmail('');
      setName('');
      setRole('reportante');
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActivo(u: ManagedUser) {
    try {
      await api.updateAdminUser(u.id, { activo: !u.activo });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleRole(u: ManagedUser) {
    const nextRole: Role = u.role === 'administrador' ? 'reportante' : 'administrador';
    try {
      await api.updateAdminUser(u.id, { role: nextRole });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-primary-dark">Usuarios autorizados</h2>
      <p className="mb-4 text-slate-600">
        Solo las personas registradas aquí (y activas) pueden iniciar sesión con Google en la plataforma. Agrega
        el correo institucional de quien necesite entrar.
      </p>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Correo</label>
          <input
            type="email"
            required
            className="field-input min-w-[220px]"
            placeholder="nombre.apellido@edu.gob.sv"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Nombre (opcional)</label>
          <input
            type="text"
            className="field-input min-w-[180px]"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Rol</label>
          <select className="field-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="reportante">Reportante</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Agregando…' : 'Agregar usuario'}
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          className="field-input min-w-[220px] flex-1"
          placeholder="Buscar por correo o nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="reportante">Reportante</option>
          <option value="administrador">Administrador</option>
        </select>
        <select className="field-input" value={activoFilter} onChange={(e) => setActivoFilter(e.target.value)}>
          <option value="">Todos (activos e inactivos)</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo desactivados</option>
        </select>
      </div>

      {error && <p className="mb-3 font-medium text-red-600">{error}</p>}
      {loading && <p>Cargando…</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Correo</th>
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5">Rol</th>
                <th className="px-4 py-2.5">Activo</th>
                <th className="px-4 py-2.5">Último acceso</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = me?.email === u.email;
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5">{u.email}</td>
                    <td className="px-4 py-2.5">{u.name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <button
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => toggleRole(u)}
                        disabled={isSelf}
                        title={isSelf ? 'No puedes cambiar tu propio rol.' : 'Cambiar rol'}
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${
                          u.activo ? 'bg-green-600' : 'bg-slate-400'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString('es-SV') : 'Nunca'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                        onClick={() => toggleActivo(u)}
                        disabled={isSelf}
                        title={isSelf ? 'No puedes desactivar tu propia cuenta.' : undefined}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={6}>
                    No hay usuarios que coincidan con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            Página {page} de {totalPages} · {total} {total === 1 ? 'usuario' : 'usuarios'}
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
