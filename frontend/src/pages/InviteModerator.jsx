import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Send, CheckCircle2, Copy, RefreshCw, Trash2, Mail } from 'lucide-react';
import { adminAPI, campusAPI } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';

// Date utility
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

// Skeletons
const InvitesSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex gap-4 items-center bg-white border border-slate-100 rounded-xl p-4 animate-pulse">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/6" />
        </div>
        <div className="w-20 h-6 bg-slate-100 rounded" />
        <div className="w-32 h-8 bg-slate-100 rounded" />
      </div>
    ))}
  </div>
);

// Illustrated Empty State
const EmptyInvitesIllustration = () => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <svg className="w-14 h-14 text-slate-300 mb-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5M12 14v.01" />
    </svg>
    <p className="text-sm font-semibold text-slate-700">No pending invitations</p>
    <p className="text-xs text-slate-400 mt-1 max-w-xs">All sent invitation links have been claimed or revoked.</p>
  </div>
);

const InviteModerator = () => {
  // State for campuses dropdown
  const [campuses, setCampuses] = useState([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [campusesError, setCampusesError] = useState(null);

  // State for pending invitations list
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [invitesError, setInvitesError] = useState(null);

  // General loading & actions state
  const [submitting, setSubmitting] = useState(false);
  const [sentInvite, setSentInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load campuses and pending invites on mount
  useEffect(() => {
    let isMounted = true;

    const loadCampuses = async () => {
      try {
        setCampusesLoading(true);
        setCampusesError(null);
        const data = await campusAPI.list();
        if (isMounted) {
          setCampuses(data || []);
        }
      } catch (err) {
        console.error('Error fetching campuses:', err);
        if (isMounted) {
          setCampusesError(err.response?.data?.message || 'Failed to load campuses from server.');
        }
      } finally {
        if (isMounted) {
          setCampusesLoading(false);
        }
      }
    };

    loadCampuses();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadInvites = async () => {
    try {
      setInvitesLoading(true);
      setInvitesError(null);
      const response = await adminAPI.listInvites();
      setInvites(response.data || []);
    } catch (err) {
      console.error('Error fetching invites:', err);
      setInvitesError(err.response?.data?.message || 'Failed to load pending invites.');
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSentInvite(null);
    try {
      const response = await adminAPI.invite(data);
      toast.success(response.message || 'Invitation sent successfully!');
      
      setSentInvite(response.data);
      reset();
      loadInvites();
    } catch (err) {
      console.error('Invite error response data:', err.response?.data);
      const errorMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to send invitation.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (inviteId) => {
    setActionLoading(inviteId);
    try {
      const response = await adminAPI.resendInvite(inviteId);
      toast.success(response.message || 'Invitation resent successfully!');
      loadInvites();
    } catch (err) {
      console.error('Resend error response data:', err.response?.data);
      const errorMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to resend invitation.';
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (inviteId) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
    setActionLoading(inviteId);
    try {
      const response = await adminAPI.revokeInvite(inviteId);
      toast.success(response.message || 'Invitation revoked successfully!');
      
      if (sentInvite && sentInvite.invite_id === inviteId) {
        setSentInvite(null);
      }
      
      loadInvites();
    } catch (err) {
      console.error('Revoke error response data:', err.response?.data);
      const errorMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to revoke invitation.';
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Invite Campus Moderator</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Send an onboarding magic link email to assign a new moderator to a campus.
        </p>
      </div>

      {/* Invitation Form Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-6 md:p-8 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Moderator Email Address"
            type="email"
            id="email"
            placeholder="moderator@university.edu"
            error={errors.email}
            disabled={submitting}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="campus_id" className="text-xs font-semibold text-slate-700 tracking-wide">
              Assign Campus
            </label>
            <select
              id="campus_id"
              disabled={submitting || campusesLoading || campuses.length === 0}
              className={`px-3 py-2 text-sm bg-white border ${
                errors.campus_id ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
              } rounded-lg outline-none shadow-2xs transition-all duration-200 focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed`}
              {...register('campus_id', { required: 'Campus assignment is required' })}
            >
              {campusesLoading ? (
                <option value="">Loading campuses...</option>
              ) : campuses.length === 0 ? (
                <option value="">No campuses available</option>
              ) : (
                <>
                  <option value="">Select Campus</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.campus_id && (
              <span className="text-xs text-red-500 font-medium">{errors.campus_id.message}</span>
            )}
            {campusesError && (
              <span className="text-xs text-red-500 font-medium">{campusesError}</span>
            )}
          </div>

          <Button
            type="submit"
            isLoading={submitting}
            disabled={submitting || campusesLoading || campuses.length === 0}
            className="w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Invitation Link
          </Button>
        </form>

        {sentInvite && (
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-6 text-emerald-800 text-sm space-y-4 mt-4 animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-emerald-950">Onboarding Invitation Created!</span>
            </div>
            
            <div className="text-xs space-y-2.5 text-slate-700 bg-white/70 p-4 rounded-xl border border-emerald-100/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-emerald-100/30">
                <p><strong>Email:</strong> <span className="text-slate-900 font-medium">{sentInvite.email}</span></p>
                <p><strong>Campus:</strong> <span className="text-slate-900 font-medium">{sentInvite.campus}</span></p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-emerald-100/30">
                <p><strong>Expiry:</strong> <span className="text-slate-900">24 hours (Expires tomorrow at {new Date(Date.now() + 24*60*60*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span></p>
                <p>
                  <strong>Status:</strong> &nbsp;
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                    Invitation Pending
                  </span>
                </p>
              </div>
              
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-[10px] uppercase tracking-wider text-slate-400">Onboarding Link:</strong>
                <span className="text-blue-600 font-mono select-all break-all text-xs block leading-tight">
                  {sentInvite.invite_link}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(sentInvite.invite_link)}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Invitation Link'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleResend(sentInvite.invite_id)}
                isLoading={actionLoading === sentInvite.invite_id}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Link
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleRevoke(sentInvite.invite_id)}
                isLoading={actionLoading === sentInvite.invite_id}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Revoke Link
              </Button>
            </div>
            
            <p className="text-[10px] text-emerald-600/80">
              In development, check the Django server stdout logs to view the sent SMTP email output.
            </p>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pending Invitations</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Active invitation links sent to campus moderators.
          </p>
        </div>

        {invitesLoading ? (
          <InvitesSkeleton />
        ) : invitesError ? (
          <div className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">
            {invitesError}
          </div>
        ) : invites.length === 0 ? (
          <EmptyInvitesIllustration />
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Campus</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  return (
                    <tr key={invite.id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold truncate max-w-[160px] text-xs" title={invite.email}>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{invite.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-650">{invite.campus_name}</td>
                      <td className="py-3.5 px-4 text-[10px] text-slate-400">
                        {formatDate(invite.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-slate-400">
                        {new Date(invite.expires_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          isExpired 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {isExpired ? 'Expired' : 'Invitation Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invite.id)}
                          isLoading={actionLoading === invite.id}
                          disabled={actionLoading !== null}
                          className="text-[10px] py-0.5 px-2.5 h-7 inline-flex items-center gap-1 shadow-2xs"
                        >
                          <RefreshCw className={`w-3 h-3 ${actionLoading === invite.id ? 'animate-spin' : ''}`} />
                          Resend
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevoke(invite.id)}
                          isLoading={actionLoading === invite.id}
                          disabled={actionLoading !== null}
                          className="text-[10px] py-0.5 px-2.5 h-7 inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModerator;
