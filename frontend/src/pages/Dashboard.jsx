import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  UserCheck, 
  PlusCircle, 
  Globe, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  FileEdit, 
  UserPlus, 
  Clock, 
  BookOpen 
} from 'lucide-react';
import { authAPI, adminAPI, articlesAPI, campusAPI } from '../services/api';
import Badge from '../components/Badge';
import Button from '../components/Button';

// Utilities
const getDisplayName = (email) => {
  if (!email) return '';
  const prefix = email.split('@')[0].split(/[._-]/)[0];
  const nameOnly = prefix.replace(/[0-9]/g, '');
  if (nameOnly.toLowerCase().startsWith('mahesh')) return 'Mahesh';
  return nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1).toLowerCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

const getCategoryBadgeClass = (category) => {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'NEWS': return 'bg-blue-50 text-blue-700 border border-blue-100';
    case 'EVENT': return 'bg-purple-50 text-purple-700 border border-purple-100';
    case 'ANNOUNCEMENT': return 'bg-amber-50 text-amber-700 border border-amber-100';
    case 'FEATURE': return 'bg-pink-50 text-pink-700 border border-pink-100';
    default: return 'bg-slate-50 text-slate-700 border border-slate-100';
  }
};

// Illustrated Empty States
const EmptyArticlesIllustration = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 13H8m8 4H8m2-8H8" />
    </svg>
    <p className="text-sm font-semibold text-slate-700">No recent articles found</p>
    <p className="text-xs text-slate-400 mt-1 max-w-xs">There are no articles published or drafted recently for your campus.</p>
  </div>
);

const EmptyModeratorsIllustration = () => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <svg className="w-14 h-14 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
    <p className="text-xs font-semibold text-slate-700">No moderators assigned</p>
    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">Send onboarding invitation links to assign campus moderators.</p>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [moderators, setModerators] = useState([]);
  const [invites, setInvites] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const currentUser = await authAPI.getMe();
        setUser(currentUser);

        if (currentUser.role === 'ADMIN') {
          const [
            allArticlesRes,
            publishedArticlesRes,
            draftArticlesRes,
            modsList,
            invitesList,
            campusesList
          ] = await Promise.all([
            articlesAPI.list(),
            articlesAPI.list({ status: 'PUBLISHED' }),
            articlesAPI.list({ status: 'DRAFT' }),
            adminAPI.getModerators(),
            adminAPI.listInvites(),
            campusAPI.list()
          ]);

          setRecentArticles(allArticlesRes.results?.slice(0, 5) || []);
          setModerators(modsList || []);
          setInvites(invitesList.data || invitesList || []);

          setStats({
            totalArticles: allArticlesRes.count || allArticlesRes.results?.length || 0,
            publishedArticles: publishedArticlesRes.count || publishedArticlesRes.results?.length || 0,
            draftArticles: draftArticlesRes.count || draftArticlesRes.results?.length || 0,
            activeModerators: (modsList || []).filter(m => m.is_active).length,
            pendingInvitations: (invitesList.data || invitesList || []).length,
            totalCampuses: (campusesList || []).length,
          });
        } else {
          // Moderator
          const [
            allArticlesRes,
            publishedArticlesRes,
            draftArticlesRes,
          ] = await Promise.all([
            articlesAPI.list(),
            articlesAPI.list({ status: 'PUBLISHED' }),
            articlesAPI.list({ status: 'DRAFT' }),
          ]);

          setRecentArticles(allArticlesRes.results?.slice(0, 5) || []);
          setStats({
            totalArticles: allArticlesRes.count || allArticlesRes.results?.length || 0,
            publishedArticles: publishedArticlesRes.count || publishedArticlesRes.results?.length || 0,
            draftArticles: draftArticlesRes.count || draftArticlesRes.results?.length || 0,
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getUnifiedModerators = () => {
    // Registered active moderators
    const regMods = moderators.map(m => ({
      id: m.id,
      email: m.email,
      campusName: m.campus_name || m.campus || 'Global/None',
      status: m.is_active ? 'Active' : 'Inactive',
      joinedDate: m.created_at,
      type: 'user'
    }));

    // Pending/Expired invitations
    const pendingInvites = invites.map(i => {
      const isExpired = new Date(i.expires_at) < new Date();
      return {
        id: i.id,
        email: i.email,
        campusName: i.campus_name || 'Unassigned',
        status: isExpired ? 'Expired' : 'Invitation Pending',
        joinedDate: null,
        type: 'invite'
      };
    });

    return [...regMods, ...pendingInvites];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs h-24 animate-pulse bg-slate-50/50" />
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs h-28 animate-pulse bg-slate-50/50" />
          ))}
        </div>

        {/* Content Split Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs h-80 lg:col-span-2 animate-pulse bg-slate-50/50" />
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs h-80 animate-pulse bg-slate-50/50" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const unifiedMods = getUnifiedModerators();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome back, {getDisplayName(user.email)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user.role === 'ADMIN'
              ? 'Administrator workspace for managing global moderators and university articles.'
              : `Moderator workspace for ${user.campus_name || user.campus}. Create and manage local campus news.`}
          </p>
        </div>
        <div>
          {user.role === 'ADMIN' ? (
            <Link to="/invite">
              <Button className="flex items-center gap-2 shadow-2xs hover:scale-102 transition-transform">
                <PlusCircle className="w-4 h-4" />
                Invite Moderator
              </Button>
            </Link>
          ) : (
            <Link to="/articles/new">
              <Button className="flex items-center gap-2 shadow-2xs hover:scale-102 transition-transform">
                <PlusCircle className="w-4 h-4" />
                Create Article
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {user.role === 'ADMIN' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.publishedArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.draftArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileEdit className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Moderators</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.activeModerators}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invitations</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingInvitations}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Campuses</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCampuses}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.publishedArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Articles</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.draftArticles}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileEdit className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Campus</p>
              <h3 className="text-lg font-bold text-slate-950 mt-2.5 truncate max-w-[150px]" title={user.campus_name || user.campus}>
                {user.campus_name || user.campus}
              </h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Recent Articles */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-950">Recent Campus Articles</h2>
            <Link to="/articles" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentArticles.length === 0 ? (
            <EmptyArticlesIllustration />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Article Title</th>
                    <th className="pb-3 text-left">Category</th>
                    <th className="pb-3 text-left">Campus</th>
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-800 text-xs truncate max-w-[180px]" title={article.title}>
                        <Link to="/articles" className="hover:text-blue-600 transition-colors">
                          {article.title}
                        </Link>
                      </td>
                      <td className="py-3 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getCategoryBadgeClass(article.category)}`}>
                          {article.category}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500 font-medium truncate max-w-[110px]" title={article.campus_name || article.campus}>
                        {article.campus_name || article.campus}
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                        {formatDate(article.created_at)}
                      </td>
                      <td className="py-3 text-xs text-right">
                        <Badge variant={article.status === 'PUBLISHED' || article.status === 'Published' ? 'green' : 'amber'}>
                          {article.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Admin list / Quick tips */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-6 space-y-4">
          {user.role === 'ADMIN' ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-slate-950">Moderators Directory</h2>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Total: {unifiedMods.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {unifiedMods.length === 0 ? (
                  <EmptyModeratorsIllustration />
                ) : (
                  unifiedMods.map((mod, idx) => {
                    const getStatusStyle = (status) => {
                      switch (status) {
                        case 'Active':
                          return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                        case 'Invitation Pending':
                          return 'bg-amber-50 text-amber-700 border border-amber-100';
                        case 'Expired':
                          return 'bg-rose-50 text-rose-700 border border-rose-100';
                        default:
                          return 'bg-slate-50 text-slate-600 border border-slate-100';
                      }
                    };

                    return (
                      <div key={mod.id || idx} className="flex flex-col p-3 bg-slate-50/70 border border-slate-100 hover:border-slate-200 rounded-xl transition-all duration-200 space-y-2">
                        <div className="flex items-start justify-between min-w-0">
                          <div className="overflow-hidden min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-800 truncate" title={mod.email}>
                              {mod.email}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              Campus: <span className="text-slate-600 font-semibold">{mod.campusName}</span>
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 uppercase tracking-wider ${getStatusStyle(mod.status)}`}>
                            {mod.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100/50">
                          <span>{mod.joinedDate ? `Joined: ${formatDate(mod.joinedDate)}` : 'Invite Sent'}</span>
                          {mod.type === 'invite' && (
                            <span className="text-amber-600 italic">Invited</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-950">Moderator Code of Conduct</h2>
              <div className="space-y-4 text-xs leading-relaxed text-slate-500">
                <p>
                  As a moderator for <strong>{user.campus_name || user.campus}</strong>, you have access to create, publish, and delete articles for your campus.
                </p>
                <div className="p-3 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-xl space-y-2">
                  <p className="font-semibold">Security Guideline:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Campus access filters are enforced strictly at the database layer.</li>
                    <li>Always verify post contents and category tags before publication.</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
