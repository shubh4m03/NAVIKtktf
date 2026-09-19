/**
 * App.tsx — NAVIK main SPA router
 *
 * Authentication design: ZERO-FRICTION, NO LOGIN PAGE.
 *
 * Route structure:
 *   /          → NAVIK cinematic landing page (HeroExperience, no auth wall)
 *   /decision  → Command Center Dashboard  ┐
 *   /carrier   → Carrier Intelligence      │
 *   /market    → Freight Market            │  All wrapped in AuthBootstrapProvider
 *   /vessels   → Vessel Explorer           │  which silently obtains a JWT before
 *   /routes    → Route Intelligence        │  rendering any protected route.
 *   /ports     → Port Intelligence         │
 *   /what-if   → What-If Simulator         │
 *   /nirnay    → NIRNAY AI Command Center  │
 *   /reports   → Economic Backtest Report  ┘
 *
 * The old /login route is completely removed.
 * No ProtectedRoute / redirect to /login exists anywhere in this file.
 */
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/shared/Layout';
import CommandCenterDashboard from '@/components/CommandCenterDashboard';
import CarrierIntelligence from '@/components/carrier-intelligence/CarrierIntelligence';
import FreightMarket from '@/components/freight-market/FreightMarket';
import RouteIntelligence from '@/components/route-intelligence/RouteIntelligence';
import VesselExplorer from '@/components/vessel-explorer/VesselExplorer';
import NirnayCommandCenter from '@/components/nirnayn/NirnayCommandCenter';
import WhatIfSimulator from '@/components/what-if/WhatIfSimulator';
import EconomicBacktestReport from '@/components/reports/EconomicBacktestReport';
import NavikLandingPage from '@/components/public/NavikLandingPage';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScenarioProvider } from '@/context/ScenarioContext';
import { AuthBootstrapProvider } from '@/context/AuthBootstrapContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

/** Minimal fullscreen loading state while lazy chunks hydrate */
function AppLoadingFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#020817',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <ErrorBoundary fallbackMessage="A critical application error occurred.">
          <BrowserRouter>
            {/*
             * AuthBootstrapProvider wraps the entire router tree.
             * It silently calls POST /api/v1/auth/login on mount and
             * stores the JWT in localStorage.  All routes — including the
             * landing page — render inside this provider, but the landing
             * page itself does not require a token (it shows first, while
             * the bootstrap happens in the background).
             */}
            <AuthBootstrapProvider>
              <Suspense fallback={<AppLoadingFallback />}>
                <Routes>
                  {/* ── PUBLIC: NAVIK Cinematic Landing Page ── */}
                  <Route path="/" element={<NavikLandingPage />} />

                  {/* ── REDIRECT: any legacy /login or /auth link → root ── */}
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/signin" element={<Navigate to="/" replace />} />
                  <Route path="/auth" element={<Navigate to="/" replace />} />

                  {/* ── PROTECTED APPLICATION ROUTES ─────────────────────
                      Auth is guaranteed by AuthBootstrapProvider above.
                      No additional ProtectedRoute wrapper needed.       ── */}
                  <Route element={<Layout />}>
                    <Route path="/decision" element={<CommandCenterDashboard />} />
                    <Route path="/overview" element={<Navigate to="/decision" replace />} />
                    <Route path="/carrier" element={<CarrierIntelligence />} />
                    <Route path="/market" element={<FreightMarket />} />
                    <Route path="/vessels" element={<VesselExplorer />} />
                    <Route path="/routes" element={<RouteIntelligence />} />
                    <Route path="/ports" element={<RouteIntelligence />} />
                    <Route path="/what-if" element={<WhatIfSimulator />} />
                    <Route path="/nirnay" element={<NirnayCommandCenter />} />
                    <Route path="/nirnayn" element={<Navigate to="/nirnay" replace />} />
                    <Route path="/reports" element={<EconomicBacktestReport />} />
                  </Route>

                  {/* ── FALLBACK ── */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AuthBootstrapProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </ScenarioProvider>
    </ThemeProvider>
  );
}
