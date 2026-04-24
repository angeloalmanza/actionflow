import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from './Button'

export default function Layout({ children }) {
  const { logout, user } = useAuth()
  const { workspaceId }  = useParams()
  const { pathname }     = useLocation()

  const navItems = workspaceId ? [
    { to: '/',                                        label: '← Workspaces' },
    { to: `/workspaces/${workspaceId}/board`,         label: 'Board' },
    { to: `/workspaces/${workspaceId}/meetings`,      label: 'Riunioni' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-indigo-600">ActionFlow</Link>
          <nav className="flex gap-4">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors ${pathname === to ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Esci</Button>
        </div>
      </header>
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
