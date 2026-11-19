import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FolderOpen, Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-secondary-900">Collaborative Workspace</span>
          </Link>
          <h1 className="text-3xl font-bold text-secondary-900">Create an account</h1>
          <p className="text-secondary-600 mt-2">Start collaborating with your team</p>
        </div>
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input {...register('firstName')} id="firstName" type="text" autoComplete="given-name" className={`input pl-10 ${errors.firstName ? 'input-error' : ''}`} placeholder="John" disabled={isLoading} />
                </div>
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last Name</label>
                <input {...register('lastName')} id="lastName" type="text" autoComplete="family-name" className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Doe" disabled={isLoading} />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input {...register('email')} id="email" type="email" autoComplete="email" className={`input pl-10 ${errors.email ? 'input-error' : ''}`} placeholder="user@company.com" disabled={isLoading} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input {...register('password')} id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" disabled={isLoading} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
