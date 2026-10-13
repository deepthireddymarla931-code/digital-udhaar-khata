import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, Loader2, Sparkles, Settings, Radio, Check, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../api/axios';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Backend connection state
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());
  const [serverStatus, setServerStatus] = useState('CHECKING'); // CHECKING | ONLINE | SLEEPING | ERROR
  const [showSettings, setShowSettings] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(getApiBaseUrl());
  const [testingUrl, setTestingUrl] = useState(false);

  const checkServerHealth = async (urlToCheck = getApiBaseUrl()) => {
    setServerStatus('CHECKING');
    try {
      const healthUrl = urlToCheck.replace(/\/+$/, '') + '/health';
      const res = await axios.get(healthUrl, { timeout: 10000 });
      if (res.data?.status === 'UP') {
        setServerStatus('ONLINE');
      } else {
        setServerStatus('ONLINE');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setServerStatus('SLEEPING');
      } else if (err.response?.status === 404) {
        setServerStatus('ERROR');
      } else {
        setServerStatus('SLEEPING');
      }
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  const handleSaveCustomUrl = async () => {
    setTestingUrl(true);
    let target = customInputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    if (!target.includes('/api')) {
      target = `${target.replace(/\/+$/, '')}/api/v1`;
    }

    try {
      const healthUrl = target.replace(/\/+$/, '') + '/health';
      await axios.get(healthUrl, { timeout: 12000 });
      localStorage.setItem('custom_api_url', target);
      setCurrentUrl(target);
      setServerStatus('ONLINE');
      setShowSettings(false);
      setError('');
      alert('Connected successfully to: ' + target);
    } catch (err) {
      alert('Could not connect to: ' + target + ' (Error: ' + err.message + ')');
    } finally {
      setTestingUrl(false);
    }
  };

  const handleResetUrl = () => {
    localStorage.removeItem('custom_api_url');
    const def = getApiBaseUrl();
    setCurrentUrl(def);
    setCustomInputUrl(def);
    checkServerHealth(def);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. If this is your first visit, cloud server may still be booting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Merchant Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">Welcome back to Digital Udhaar Khata</p>
        </div>

        {/* Server Connection Status Banner */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === 'ONLINE'
                  ? 'bg-emerald-400 animate-pulse'
                  : serverStatus === 'SLEEPING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {serverStatus === 'ONLINE' && 'Cloud Backend: Online'}
              {serverStatus === 'SLEEPING' && 'Waking up server (takes ~30s on free tier)...'}
              {serverStatus === 'CHECKING' && 'Connecting to Cloud Backend...'}
              {serverStatus === 'ERROR' && 'Backend URL not responding (check settings)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
            title="Configure Server URL"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Server Settings Panel */}
        {showSettings && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">Backend API Endpoint:</span>
              <button
                type="button"
                onClick={handleResetUrl}
                className="text-[10px] text-slate-400 hover:text-rose-400"
              >
                Reset Default
              </button>
            </div>
            <input
              type="text"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="e.g. https://digital-udhaar-backend-xxxx.onrender.com/api/v1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 truncate max-w-[200px]">Active: {currentUrl}</span>
              <button
                type="button"
                onClick={handleSaveCustomUrl}
                disabled={testingUrl}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                {testingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Connect
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In to Shop Khata</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setEmail('merchant@example.com');
              setPassword('password123');
              setLoading(true);
              try {
                await login({ email: 'merchant@example.com', password: 'password123' });
                navigate('/');
              } catch (err) {
                setError('Demo login error: ' + (err.response?.data?.message || err.message));
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>⚡ 1-Click Demo Sign-In (Rajesh Sharma)</span>
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Don't have a merchant account?{' '}
            <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Register Shop Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
