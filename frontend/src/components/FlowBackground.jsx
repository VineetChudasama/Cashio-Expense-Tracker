import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * FlowBackground - Premium Ambient Aurora & Precision Matrix Background
 * Features:
 * - Dynamic organic aurora mesh gradients (Emerald, Violet/Indigo, Cyan)
 * - Precision dot-grid matrix with radial mask
 * - Subtle cursor-follow ambient glow
 * - Full Dark / Light mode responsiveness
 */
export default function FlowBackground({ children, showGrid = true, showAurora = false, interactive = false }) {
  const { isDark } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* 3. Modern Technical Matrix Grid Overlay */}
      {showGrid && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-40 transition-opacity duration-300"
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)'
              : 'radial-gradient(rgba(20, 125, 112, 0.18) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, #000 35%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, #000 35%, transparent 85%)',
          }}
        />
      )}

      {/* 4. Streamline Vector Contours (Subtle Cash Flow Currents) */}
      <svg
        className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="flowWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#10B981' : '#147D70'} stopOpacity="0.4" />
            <stop offset="50%" stopColor={isDark ? '#06B6D4' : '#3BAE9F'} stopOpacity="0.25" />
            <stop offset="100%" stopColor={isDark ? '#6366F1' : '#147D70'} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M-100,200 C300,120 700,380 1400,180 S2000,320 2600,160"
          fill="none"
          stroke="url(#flowWaveGrad)"
          strokeWidth="1.2"
          strokeDasharray="6 8"
        />
        <path
          d="M-100,420 C400,300 800,560 1500,360 S2100,480 2600,320"
          fill="none"
          stroke="url(#flowWaveGrad)"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      </svg>

      {/* 5. Main Content Foreground */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
