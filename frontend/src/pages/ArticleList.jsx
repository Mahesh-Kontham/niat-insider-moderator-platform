import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { articlesAPI, authAPI, campusAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';

// Utilities
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

// Skeletons
const TableSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((n) => (
      <div key={n} className="flex gap-4 items-center bg-white border border-slate-100 rounded-xl p-4 animate-pulse">
        <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/6" />
        </div>
        <div className="w-20 h-6 bg-slate-100 rounded" />
        <div className="w-24 h-6 bg-slate-100 rounded" />
      </div>
    ))}
  </div>
);

// Illustrated Empty State
const EmptyArticlesIllustration = ({ isFiltered, onClearFilters, isModerator }) => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-12 text-center flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 select-none">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v6h6" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-1">
      {isFiltered ? 'No matching articles found' : 'No articles have been published yet'}
    </h3>
    <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
      {isFiltered 
        ? 'Adjust your search parameters, sort order, campus scopes, or date ranges.' 
        : 'Get started by writing and publishing your first news article for the campus.'}
    </p>
    <div className="flex gap-3">
      {isFiltered && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
      {isModerator && (
        <Link to="/articles/new">
          <Button className="flex items-center gap-2 shadow-2xs">
            <Plus className="w-4 h-4" />
            Create First Article
          </Button>
        </Link>
      )}
    </div>
  </div>
);

const ArticleList = () => {
  const location = useLocation();
  const highlightedId = location.state?.highlightedId;

  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [campus, setCampus] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewArticle, setViewArticle] = useState(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      if (campus) params.campus = campus;
      if (ordering) params.ordering = ordering;

      const data = await articlesAPI.list(params);
      setArticles(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load articles.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        const currentUser = await authAPI.getMe();
        setUser(currentUser);
        
        if (currentUser.role === 'ADMIN') {
          const campusList = await campusAPI.list();
          setCampuses(campusList || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [search, category, status, campus, ordering]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setCampus('');
    setOrdering('-created_at');
    setStartDate('');
    setEndDate('');
  };

  const handleDeleteClick = (id) => {
    setSelectedArticleId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedArticleId) return;
    setDeleting(true);
    try {
      await articlesAPI.delete(selectedArticleId);
      toast.success('Article deleted successfully.');
      setIsDeleteOpen(false);
      loadArticles();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete article.');
    } finally {
      setDeleting(false);
    }
  };

  const getFilteredArticles = () => {
    let list = [...articles];
    
    // local date-range filtering
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter(a => new Date(a.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(a => new Date(a.created_at) <= end);
    }
    
    return list;
  };

  const isFiltered = !!(search || category || status || campus || startDate || endDate);
  const displayArticles = getFilteredArticles();

  if (loading && articles.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-1/4" />
        <div className="flex gap-4">
          <Skeleton variant="text" className="w-1/3 h-10" />
          <Skeleton variant="text" className="w-1/6 h-10" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Articles Directory</h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === 'ADMIN'
              ? 'View and manage all articles published across campuses.'
              : `Manage and edit articles scoped to your campus.`}
          </p>
        </div>
        {user?.role === 'MODERATOR' && (
          <Link to="/articles/new">
            <Button className="flex items-center gap-2 shadow-2xs hover:scale-102 transition-transform">
              <Plus className="w-4 h-4" />
              Write Article
            </Button>
          </Link>
        )}
      </div>

      {/* Enhanced Filters Bar */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm bg-white outline-none shadow-2xs transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Campus Filter - ADMIN only */}
            {user?.role === 'ADMIN' && (
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="px-3 py-2 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm bg-white outline-none shadow-2xs text-slate-600 min-w-[140px]"
              >
                <option value="">All Campuses</option>
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm bg-white outline-none shadow-2xs text-slate-600 min-w-[140px]"
            >
              <option value="">All Categories</option>
              <option value="NEWS">News</option>
              <option value="EVENT">Event</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="FEATURE">Feature</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm bg-white outline-none shadow-2xs text-slate-600 min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>

            {/* Ordering / Sorting */}
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="px-3 py-2 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg text-sm bg-white outline-none shadow-2xs text-slate-600 min-w-[140px]"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Date Range Block */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-slate-600 text-xs pl-1">
          <span className="font-semibold text-slate-700">Filter by Date:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-md outline-none text-xs"
              placeholder="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-md outline-none text-xs"
              placeholder="End Date"
            />
          </div>
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {displayArticles.length === 0 ? (
        <EmptyArticlesIllustration 
          isFiltered={isFiltered} 
          onClearFilters={handleClearFilters} 
          isModerator={user?.role === 'MODERATOR'} 
        />
      ) : (
        /* Articles Directory Table */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cover / Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Campus Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Author Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Created Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayArticles.map((article) => (
                  <tr 
                    key={article.id} 
                    className={`transition-all duration-500 ${
                      article.id === highlightedId 
                        ? 'bg-blue-50/60 border-l-4 border-l-blue-500 animate-pulse' 
                        : 'hover:bg-slate-50/35 border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 object-cover rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                          {article.image ? (
                            <img
                              src={article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 text-xs leading-snug truncate max-w-[220px]" title={article.title}>
                          {article.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${getCategoryBadgeClass(article.category)}`}>
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={article.status === 'PUBLISHED' || article.status === 'Published' ? 'green' : 'amber'}>
                        {article.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 truncate max-w-[120px]" title={article.campus_name || 'Global'}>
                      {article.campus_name || 'Global'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      <span className="truncate max-w-[140px] inline-block cursor-help hover:text-slate-800 transition-colors" title={article.author_name}>
                        {article.author_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        {/* View Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setViewArticle(article)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Full Details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {/* Edit Button */}
                        {user?.role === 'MODERATOR' ? (
                          <Link to={`/articles/edit/${article.id}`}>
                            <button
                              type="button"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Article"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-md"
                            title="Editing restricted to moderators"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(article.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Delete Article"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Are you sure you want to delete this article? This action is permanent and cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      {viewArticle && (
        <Modal
          isOpen={!!viewArticle}
          onClose={() => setViewArticle(null)}
          title="Article Details"
        >
          <div className="space-y-4">
            {viewArticle.image && (
              <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-100 shadow-3xs">
                <img
                  src={viewArticle.image.startsWith('http') ? viewArticle.image : `http://localhost:8000${viewArticle.image}`}
                  alt={viewArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(viewArticle.category)}`}>
                  {viewArticle.category}
                </span>
                <Badge variant={viewArticle.status === 'PUBLISHED' || viewArticle.status === 'Published' ? 'green' : 'amber'}>
                  {viewArticle.status}
                </Badge>
                <span className="text-[11px] text-slate-400 font-semibold pl-1">
                  {formatDate(viewArticle.created_at)}
                </span>
              </div>
              
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {viewArticle.title}
              </h2>
              
              <div className="flex flex-col gap-1 text-[11px] text-slate-500 border-t border-b border-slate-100 py-2.5 bg-slate-50/50 px-3 rounded-lg">
                <p>Campus: <span className="font-semibold text-slate-700">{viewArticle.campus_name || 'Global'}</span></p>
                <p>Author: <span className="font-semibold text-slate-700">{viewArticle.author_name}</span></p>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pt-2 max-h-[200px] overflow-y-auto pr-1">
                {viewArticle.body}
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setViewArticle(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ArticleList;
