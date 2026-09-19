/**
 * NavikLandingPage.tsx
 *
 * Integrates the NAVIK cinematic Three.js hero experience into the main
 * work-frontend SPA.  When the user clicks "GET STARTED" / "Launch NAVIK",
 * this component triggers invisible auth bootstrap and then navigates to the
 * dashboard — no login form, no credential prompt, nothing.
 */
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroExperience } from '../../hero/HeroExperience';
import { apiClient } from '../../services/api/client';

export default function NavikLandingPage() {
  const navigate = useNavigate();

  const handleEnterNavik = useCallback(async () => {
    // Ensure a valid token exists before entering protected routes.
    const existing = localStorage.getItem('navik_auth_token');
    if (!existing) {
      await apiClient.bootstrap();
    }
    // Navigate into the dashboard.
    navigate('/decision', { replace: true });
  }, [navigate]);

  return (
    <HeroExperience
      autoPlay={true}
      onEnterNavik={handleEnterNavik}
      checkSeenFlag={false}
    />
  );
}
