import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, UserPlus, LogOut, Shield, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { campusAPI } from '../services/api';

const getInitials = (email) => {
  if (!email) return '';
  const prefix = email.split('@')[0];
  const parts = prefix.split(/[._-]/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return prefix.slice(0, 2).toUpperCase();
};

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [campusCount, setCampusCount] = useState(null);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      campusAPI.list()
        .then(campuses => {
          setCampusCount(campuses?.length || 0);
        })
        .catch(err => {
          console.error('Error loading campus count:', err);
        });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MODERATOR'],
    },
    {
      name: 'Articles',
      path: '/articles',
      icon: FileText,
      roles: ['ADMIN', 'MODERATOR'],
    },
    {
      name: 'Invite Moderator',
      path: '/invite',
      icon: UserPlus,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-sm">
            N
          </div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight">NIAT Moderator</span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50/70 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card info footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs shrink-0 select-none">
              {getInitials(user.email)}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate" title={user.email}>
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                  user.role === 'ADMIN' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                    : 'bg-purple-50 text-purple-700 border border-purple-100'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 mb-4 text-[10px] text-slate-500 font-medium pl-1">
            {user.role === 'ADMIN' && campusCount !== null && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>Campuses Managed: {campusCount}</span>
              </div>
            )}
            {user.role === 'MODERATOR' && (user.campus_name || user.campus) && (
              <p className="truncate text-slate-500">
                Campus: <span className="font-semibold text-slate-700">{user.campus_name || user.campus}</span>
              </p>
            )}
            {user.last_login ? (
              <p className="text-slate-400 text-[9px]">Last Login: {new Date(user.last_login).toLocaleString()}</p>
            ) : user.created_at ? (
              <p className="text-slate-400 text-[9px]">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
            ) : null}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors border border-slate-200 bg-white shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-4 h-16 bg-white border-b border-slate-100 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-base">
            N
          </div>
          <span className="font-semibold text-slate-900 text-sm">NIAT Moderator</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 text-slate-500 hover:text-slate-700"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer menu */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 flex flex-col bg-white pt-16">
          <nav className="flex-1 p-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs shrink-0 select-none">
                {getInitials(user.email)}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                    user.role === 'ADMIN' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-3 text-[10px] text-slate-500 font-medium pl-1">
              {user.role === 'ADMIN' && campusCount !== null && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>Campuses Managed: {campusCount}</span>
                </div>
              )}
              {user.role === 'MODERATOR' && (user.campus_name || user.campus) && (
                <p className="truncate text-slate-500">
                  Campus: <span className="font-semibold text-slate-700">{user.campus_name || user.campus}</span>
                </p>
              )}
              {user.last_login ? (
                <p className="text-slate-400 text-[9px]">Last Login: {new Date(user.last_login).toLocaleString()}</p>
              ) : user.created_at ? (
                <p className="text-slate-400 text-[9px]">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
              ) : null}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50/40 hover:text-rose-700 transition-colors shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
