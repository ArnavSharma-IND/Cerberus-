import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { CerberusLogo } from '../../components/brand/CerberusLogo';
import { MountainBackdrop } from '../../components/brand/MountainBackdrop';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('soc_operator');
  const [password, setPassword] = useState('cerberus-soc-alpha');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      success('Authenticated', `Welcome back, ${username}`);
      navigate('/dashboard');
    } catch (err: any) {
      error('Authentication Failed', err?.message || 'Invalid operator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBypass = async () => {
    setLoading(true);
    try {
      await login('soc_operator', 'cerberus-soc-alpha');
      success('Developer Bypass Active', 'Signed in as Lead SOC Operator');
      navigate('/dashboard');
    } catch (err: any) {
      error('Authentication Error', err?.message || 'Bypass failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Mountain Silhouette */}
      <MountainBackdrop opacity={0.6} />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#EDE9FE] shadow-lavender-lg p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <CerberusLogo size={64} glow />
          </div>
          <h2 className="text-2xl font-display font-black text-[#171638] tracking-tight">
            Cerberus SOC Operator Login
          </h2>
          <p className="text-xs text-[#5B5882]">
            Authenticate to access the 5-Pillar Zero-Trust Behavioral Firewall Console
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#171638] block mb-1">
              Operator Username / Agent ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8AA7]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F3FF]/70 border border-[#EDE9FE] rounded-xl text-[#171638] focus:outline-none focus:ring-2 focus:ring-[#6654E8]/20 focus:border-[#C4B5FD] transition-all text-xs font-mono"
                placeholder="soc_operator"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#171638] block mb-1">
              HMAC Token / Secret Key
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8AA7]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F3FF]/70 border border-[#EDE9FE] rounded-xl text-[#171638] focus:outline-none focus:ring-2 focus:ring-[#6654E8]/20 focus:border-[#C4B5FD] transition-all text-xs font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="brand"
            size="md"
            className="w-full mt-2 rounded-xl shadow-lavender font-semibold"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate & Launch Console
          </Button>

          {/* Quick Demo Bypass */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickBypass}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDD6FE] bg-[#EDE9FE]/60 hover:bg-[#EDE9FE] text-[#6654E8] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>1-Click Developer Demo Bypass</span>
            </button>
          </div>

          <div className="p-3 bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl text-center text-[11px] text-[#8E8AA7] mt-3">
            Pre-configured for local testing. In production, HMAC-SHA256 signature tokens are required.
          </div>
        </form>
      </div>
    </div>
  );
};