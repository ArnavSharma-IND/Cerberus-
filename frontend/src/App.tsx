import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Pages
import {
  LandingPage,
  FeaturesPage,
  ArchitecturePage,
  ThreatLabPage,
  DocsPage,
  LoginPage
} from './pages/public';

// Dashboard Pages
import {
  OverviewPage,
  MonitoringPage,
  AgentsPage,
  BehaviorPage,
  PoliciesPage,
  IncidentsPage,
  TestingPage,
  SecurityMatrixPage,
  ApprovalInboxPage,
  AuditPage,
  AnalyticsPage,
  SettingsPage
} from './pages/dashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <TelemetryProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/threat-lab" element={<ThreatLabPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Authenticated Lavender SOC Console Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="monitoring" element={<MonitoringPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="behavior" element={<BehaviorPage />} />
                <Route path="policies" element={<PoliciesPage />} />
                <Route path="incidents" element={<IncidentsPage />} />
                <Route path="testing" element={<TestingPage />} />
                <Route path="matrix" element={<SecurityMatrixPage />} />
                <Route path="approvals" element={<ApprovalInboxPage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TelemetryProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
