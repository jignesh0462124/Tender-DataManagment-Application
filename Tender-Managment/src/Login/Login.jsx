import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  Loader2,
  LayoutDashboard
} from 'lucide-react';

// --- Supabase Client Initialization ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const Login = () => {
  const navigate = useNavigate();
  
  // View State: 'login' or 'forgot' (Signup removed)
  const [view, setView] = useState('login'); 
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Loading & Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // --- Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Handle Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Success: Navigate to Dashboard
      if (data.user) {
        console.log('Login Successful:', data.user);
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage('Password reset link sent to your email.');
      setTimeout(() => setView('login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* --- Left Side: Hero Section --- */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Osaioriginal</span>
          </div>

          {/* Text Content */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              Welcome to Osaioriginal
            </h1>
            <p className="text-slate-400 text-lg">
              Your Smart Tender Data Store & Monitoring Platform. Track, analyze, and win.
            </p>
          </div>

          {/* Illustration Container */}
          <div className="relative w-full h-[400px] bg-blue-900/20 rounded-[100px] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-sm flex items-center justify-center">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full blur-[50px] opacity-40"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-40"></div>
            
            <img 
              src="https://img.freepik.com/free-vector/business-team-brainstorming-discussing-startup-project_74855-6909.jpg?w=1060&t=st=1701980000~exp=1701980600~hmac=9a0c1021430000" 
              alt="Team Collaboration" 
              className="w-[85%] h-auto object-cover mix-blend-overlay opacity-90"
            />
          </div>
        </div>

        {/* --- Right Side: Auth Card --- */}
        <div className="bg-[#e2e8f0] rounded-3xl p-8 md:p-12 shadow-2xl w-full max-w-md mx-auto lg:ml-auto transition-all duration-300">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {view === 'login' ? 'Login In to Your Account' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 text-sm">
              {view === 'login' 
                ? 'Enter your credentials to access your dashboard' 
                : 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {message}
            </div>
          )}

          {/* --- FORGOT PASSWORD FORM --- */}
          {view === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-700 placeholder-slate-400"
                    required 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
              </button>
              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full text-slate-600 text-sm font-medium hover:text-blue-600"
              >
                Back to Login
              </button>
            </form>
          ) : (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Email Input */}
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-700 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-700 placeholder-slate-400"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Extras: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe 
                    ? <CheckSquare className="text-blue-600 w-5 h-5" /> 
                    : <Square className="text-slate-400 group-hover:text-slate-500 w-5 h-5" />
                  }
                  <span className="text-sm text-slate-600 select-none">Remember me</span>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-blue-500/30 transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
              </button>
              {/* Google Login */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;