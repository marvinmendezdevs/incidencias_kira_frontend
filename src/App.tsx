import React, { ReactNode, useState } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import Schools from './pages/Schools';
import SchoolSections from './pages/SchoolSections';
import ReportForm from './pages/ReportForm';
import IncidentsList from './pages/IncidentsList';
import AdminImport from './pages/AdminImport';
import IncidentTypesAdmin from './pages/IncidentTypesAdmin';
import UsersAdmin from './pages/UsersAdmin';
import ResolveIncidents from './pages/ResolveIncidents';

function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-primary-dark">Incidencias KIRA</h1>
        <p className="mb-6 text-slate-600">
          Reporta y da seguimiento a incidencias de secciones, docentes, estudiantes y contenido.
        </p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(cred: CredentialResponse) =>
              cred.credential
                ? loginWithGoogle(cred.credential).catch((e) => setError(e.message))
                : setError('No se recibió credencial de Google.')
            }
            onError={() => setError('No se pudo iniciar sesión con Google.')}
          />
        </div>
        {error && <p className="mt-4 font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm text-blue-100 hover:bg-white/15 hover:text-white ${
          isActive ? 'bg-white/15 text-white' : ''
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function Layout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-6 bg-primary-dark px-6 py-3 text-white shadow-md">
        <div className="text-lg font-bold">Incidencias KIRA</div>
        <nav className="flex flex-1 flex-wrap gap-2">
          <NavItem to="/">Inicio</NavItem>
          <NavItem to="/incidencias">Incidencias</NavItem>
          {isAdmin && (
            <>
              <NavItem to="/admin/secciones">Importar secciones</NavItem>
              <NavItem to="/admin/tipos">Tipos de incidencia</NavItem>
              <NavItem to="/admin/usuarios">Usuarios</NavItem>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user?.name} {isAdmin && <em className="text-blue-200">(admin)</em>}
          </span>
          <button
            onClick={logout}
            className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/incidencias" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando…</div>;
  if (!user) return <LoginScreen />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Schools />} />
        <Route path="/escuelas/:code" element={<SchoolSections />} />
        <Route path="/reportar" element={<ReportForm />} />
        <Route path="/incidencias" element={<IncidentsList />} />
        <Route
          path="/admin/secciones"
          element={
            <RequireAdmin>
              <AdminImport />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/tipos"
          element={
            <RequireAdmin>
              <IncidentTypesAdmin />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RequireAdmin>
              <UsersAdmin />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/resolver-incidencias"
          element={
            <RequireAdmin>
              <ResolveIncidents />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
