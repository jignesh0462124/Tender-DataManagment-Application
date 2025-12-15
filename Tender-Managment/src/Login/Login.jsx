import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // For smooth animations
import img5 from './img/img5.png'; // Ensure this path is correct
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  Loader2,
  LayoutDashboard,
  ArrowLeft
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
  
  // View State: 'login' or 'forgot'
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Optional: Persist 'Remember Me' state if needed
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.message || "Invalid login credentials.");
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
      // Optional: switch back to login after delay
      // setTimeout(() => setView('login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 lg:p-8 font-sans overflow-hidden relative">
      
      {/* Background Decor (Gradients) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* --- Left Side: Hero Section (Desktop Only) --- */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col justify-center space-y-8 pr-12"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Osaioriginal</span>
          </div>

          {/* Text Content */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Smart Tender Intelligence
              </span>
            </h1>
          </div>

          {/* Illustration Container */}
          <div className="relative w-full aspect-[4/3] bg-gradient-to-tr from-slate-800/50 to-slate-900/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <img 
              src={img5} 
              alt="Dashboard Analytics" 
              className="w-[90%] h-auto object-contain drop-shadow-2xl transform transition duration-700 group-hover:scale-105"
            />
          </div>
        </motion.div>

        {/* --- Right Side: Auth Card --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white w-5 h-5" />
              </div>
              <span className="text-white text-xl font-bold">Osaioriginal</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20 relative overflow-hidden">
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {view === 'login' ? 'Sign In' : 'Reset Password'}
              </h2>
              <p className="text-slate-500 text-sm">
                {view === 'login' 
                  ? 'Access your dashboard using your email.' 
                  : 'We will send you a link to reset your password.'}
              </p>
            </div>

            {/* Error / Success Messages */}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 px-4 py-3 rounded-md mb-6 text-sm">
                <p className="font-medium">Success</p>
                <p>{message}</p>
              </motion.div>
            )}

            {/* --- FORGOT PASSWORD FORM --- */}
            {view === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400"
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Reset Link'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setView('login'); setError(null); setMessage(null); }}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm font-medium hover:text-slate-800 py-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </form>
            ) : (
              /* --- LOGIN FORM --- */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Email Input */}
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-slate-700 text-sm font-semibold">Password</label>
                    <button 
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder-slate-400"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200/50"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <div 
                    className="flex items-center gap-2 cursor-pointer group select-none"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe 
                      ? <CheckSquare className="text-blue-600 w-5 h-5" /> 
                      : <Square className="text-slate-400 group-hover:text-slate-500 w-5 h-5 transition-colors" />
                    }
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          <p className="text-center text-slate-400 text-sm mt-8">
            © 2024 Osaioriginal. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;