import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../services/api';
import { KeyRound, ShieldAlert } from 'lucide-react';

const Onboarding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim();
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token missing or invalid.');
      return;
    }
    
    console.log("Outgoing payload", {
        token: token.trim(),
        password: data.password,
        confirm_password: data.confirmPassword,
    });
    
    setLoading(true);
    try {
      await authAPI.onboard({
        token: token.trim(),
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      toast.success('Onboarding complete! You can now log in.');
      navigate('/login');
    } catch (err) {
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);
      console.log("Payload:", err.config?.data);
      
      let errorMsg = 'Failed to complete onboarding. The link may have expired.';
      if (err.response?.data) {
        const resData = err.response.data;
        if (resData.message) {
          errorMsg = resData.message;
        } else if (resData.error) {
          errorMsg = resData.error;
        } else if (resData.errors) {
          errorMsg = JSON.stringify(resData.errors);
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md border border-slate-100 rounded-2xl p-8 shadow-xs text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid or Expired Onboarding Link</h2>
          <p className="text-slate-500 text-sm mb-6">
            The link you followed is missing a valid token, or it has expired. Please contact an administrator to send a new invitation.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[400px] border border-slate-100 rounded-2xl p-8 shadow-xs">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Setup Password</h2>
          <p className="text-slate-400 text-xs mt-1">Configure your login credentials for NIAT Insider</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            id="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />

          <Input
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            placeholder="••••••••"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-2"
          >
            Activate Account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
