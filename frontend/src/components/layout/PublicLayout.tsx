import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, ExternalLink, ArrowRight, Github } from 'lucide-react';
import { CerberusLogo } from '../brand/CerberusLogo';
import { Button } from '../ui/Button';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-[#171638] flex flex-col font-sans selection:bg-[#6654E8]/20 selection:text-[#171638]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#EDE9FE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <CerberusLogo size={38} glow />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#171638] tracking-tight">
                  CERBERUS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6654E8]">
                  MCP FIREWALL
                </span>
              </div>
            </div>
          </NavLink>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5B5882]">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-[#6654E8] font-semibold' : 'hover:text-[#171638] transition-colors'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/features"
              className={({ isActive }) =>
                isActive ? 'text-[#6654E8] font-semibold' : 'hover:text-[#171638] transition-colors'
              }
            >
              Features
            </NavLink>
            <NavLink
              to="/architecture"
              className={({ isActive }) =>
                isActive ? 'text-[#6654E8] font-semibold' : 'hover:text-[#171638] transition-colors'
              }
            >
              Architecture
            </NavLink>
            <NavLink
              to="/threat-lab"
              className={({ isActive }) =>
                isActive ? 'text-[#6654E8] font-semibold' : 'hover:text-[#171638] transition-colors'
              }
            >
              Threat Lab
            </NavLink>
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                isActive ? 'text-[#6654E8] font-semibold' : 'hover:text-[#171638] transition-colors'
              }
            >
              Docs
            </NavLink>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/google/cerberus"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#5B5882] hover:text-[#171638] hover:bg-[#EDE9FE] rounded-lg transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <NavLink
              to="/login"
              className="text-xs font-semibold text-[#5B5882] hover:text-[#171638] px-3 py-2 rounded-lg transition-colors"
            >
              SOC Login
            </NavLink>
            <Button
              variant="brand"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/dashboard')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EDE9FE] bg-white py-12 text-[#5B5882] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#6654E8] flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#171638]">CERBERUS v2.0</span>
              <p className="text-[11px] text-[#8E8AA7]">
                A Runtime Behavioral Firewall for Secure MCP-Based AI Agents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <NavLink to="/docs" className="hover:text-[#171638]">Documentation</NavLink>
            <NavLink to="/threat-lab" className="hover:text-[#171638]">Threat Lab</NavLink>
            <NavLink to="/dashboard" className="hover:text-[#171638]">SOC Console</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
};
