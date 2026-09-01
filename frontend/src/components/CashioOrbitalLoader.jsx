import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './CashioOrbitalLoader.css';

/**
 * CashioOrbitalLoader
 * A 3D orbital loading animation featuring the Cashio logo centered inside
 * 3 equal-sized multi-angle circular orbit rings with glowing atoms strictly anchored to the rings.
 */
const CashioOrbitalLoader = ({
  size = 'fullscreen',
  atomCount = 10,
  speed = 1,
  showText = true,
  text = 'Loading...',
  fullScreen = true,
  className = '',
}) => {
  // Graceful fallback for useTheme if context is unavailable
  let logoUrl = '/logo-dark.png';
  let isDark = true;
  try {
    const themeContext = useTheme();
    if (themeContext) {
      logoUrl = themeContext.logoUrl || logoUrl;
      isDark = themeContext.isDark ?? true;
    }
  } catch {
    // Fallback defaults
  }

  // Base orbit durations adjusted by speed multiplier
  const orbit1Duration = (6.2 / speed).toFixed(2);
  const orbit2Duration = (7.8 / speed).toFixed(2);
  const orbit3Duration = (9.4 / speed).toFixed(2);

  // Scaled dimensions depending on size prop
  const scaleMap = {
    sm: 'scale-75',
    md: 'scale-90',
    lg: 'scale-100',
    fullscreen: 'scale-90 sm:scale-100',
  };
  const activeScale = scaleMap[size] || scaleMap.fullscreen;

  // Distribution of 10 atoms evenly across the 3 equal-sized circular orbit rings
  const orbit1Atoms = [
    { id: 'o1-1', angle: 0, size: 7.5 },
    { id: 'o1-2', angle: 120, size: 6.5 },
    { id: 'o1-3', angle: 240, size: 7 },
  ];

  const orbit2Atoms = [
    { id: 'o2-1', angle: 45, size: 7.5 },
    { id: 'o2-2', angle: 135, size: 6.5 },
    { id: 'o2-3', angle: 225, size: 8 },
    { id: 'o2-4', angle: 315, size: 6 },
  ];

  const orbit3Atoms = [
    { id: 'o3-1', angle: 30, size: 7 },
    { id: 'o3-2', angle: 150, size: 7.5 },
    { id: 'o3-3', angle: 270, size: 7 },
  ];

  // Helper to compute atom coordinates on a circle (radius 50%, center 50%)
  const getAtomPosition = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const left = 50 + 50 * Math.cos(rad);
    const top = 50 + 50 * Math.sin(rad);
    return { left: `${left}%`, top: `${top}%` };
  };

  // Helper to compute synchronized depth animation delay for each atom
  const getAtomDelay = (angleDeg, durationSec) => {
    const delay = -((angleDeg / 360) * durationSec);
    return `${delay.toFixed(3)}s`;
  };

  // Common ring style so all 3 rings are identical in size, appearance, and curvature
  const ringSize = '160px';
  const ringStyle = {
    width: ringSize,
    height: ringSize,
    border: '1.2px solid rgba(114, 196, 185, 0.32)',
    boxShadow: '0 0 10px rgba(31, 118, 105, 0.22), inset 0 0 6px rgba(114, 196, 185, 0.06)',
  };

  const content = (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Viewport / Orbital Core */}
      <div
        className={`cashio-loader-container relative flex items-center justify-center ${activeScale} transition-transform duration-300`}
        style={{
          width: '260px',
          height: '230px',
          maxWidth: '90vw',
        }}
      >
        {/* Deep Ambient Glow Aura behind the logo */}
        <div
          className="cashio-ambient-glow pointer-events-none absolute w-40 h-40 rounded-full blur-2xl z-0"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(114, 196, 185, 0.15) 45%, rgba(9, 83, 72, 0.05) 70%, transparent 85%)',
          }}
        />

        {/* ================= Orbit 1 (Ring 1 - Tilted 0° Z, 68° X) ================= */}
        <div className="orbit-wrapper-1 absolute flex items-center justify-center pointer-events-none">
          <div
            className="orbit-spin-1 relative rounded-full"
            style={{
              ...ringStyle,
              '--orbit-duration-1': `${orbit1Duration}s`,
            }}
          >
            {orbit1Atoms.map((atom) => {
              const pos = getAtomPosition(atom.angle);
              const delay = getAtomDelay(atom.angle, orbit1Duration);
              return (
                <div
                  key={atom.id}
                  className="cashio-atom absolute rounded-full pointer-events-none"
                  style={{
                    ...pos,
                    width: `${atom.size}px`,
                    height: `${atom.size}px`,
                    background:
                      'radial-gradient(circle at 32% 32%, #FFFFFF 0%, #A7F3D0 22%, #72C4B9 50%, #1F7669 82%, #02221D 100%)',
                    boxShadow: '0 0 6px #72C4B9, 0 0 12px rgba(31, 118, 105, 0.7)',
                    '--atom-cycle-duration': `${orbit1Duration}s`,
                    '--atom-delay': delay,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ================= Orbit 2 (Ring 2 - Tilted 60° Z, 68° X) ================= */}
        <div className="orbit-wrapper-2 absolute flex items-center justify-center pointer-events-none">
          <div
            className="orbit-spin-2 relative rounded-full"
            style={{
              ...ringStyle,
              '--orbit-duration-2': `${orbit2Duration}s`,
            }}
          >
            {orbit2Atoms.map((atom) => {
              const pos = getAtomPosition(atom.angle);
              const delay = getAtomDelay(atom.angle, orbit2Duration);
              return (
                <div
                  key={atom.id}
                  className="cashio-atom absolute rounded-full pointer-events-none"
                  style={{
                    ...pos,
                    width: `${atom.size}px`,
                    height: `${atom.size}px`,
                    background:
                      'radial-gradient(circle at 32% 32%, #FFFFFF 0%, #99F6E4 22%, #72C4B9 52%, #1F7669 82%, #053D35 100%)',
                    boxShadow: '0 0 7px #72C4B9, 0 0 14px rgba(114, 196, 185, 0.75)',
                    '--atom-cycle-duration': `${orbit2Duration}s`,
                    '--atom-delay': delay,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ================= Orbit 3 (Ring 3 - Tilted -60° Z, 68° X) ================= */}
        <div className="orbit-wrapper-3 absolute flex items-center justify-center pointer-events-none">
          <div
            className="orbit-spin-3 relative rounded-full"
            style={{
              ...ringStyle,
              '--orbit-duration-3': `${orbit3Duration}s`,
            }}
          >
            {orbit3Atoms.map((atom) => {
              const pos = getAtomPosition(atom.angle);
              const delay = getAtomDelay(atom.angle, orbit3Duration);
              return (
                <div
                  key={atom.id}
                  className="cashio-atom absolute rounded-full pointer-events-none"
                  style={{
                    ...pos,
                    width: `${atom.size}px`,
                    height: `${atom.size}px`,
                    background:
                      'radial-gradient(circle at 32% 32%, #FFFFFF 0%, #A7F3D0 22%, #72C4B9 50%, #1F7669 80%, #02221D 100%)',
                    boxShadow: '0 0 6px #72C4B9, 0 0 12px rgba(31, 118, 105, 0.7)',
                    '--atom-cycle-duration': `${orbit3Duration}s`,
                    '--atom-delay': delay,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ================= Central Cashio Logo ================= */}
        <div className="relative z-10 flex items-center justify-center pointer-events-none">
          {/* Subtle glowing halo ring framing the logo */}
          <div
            className="absolute w-18 h-18 sm:w-20 sm:h-20 rounded-full pointer-events-none blur-sm opacity-50"
            style={{
              background:
                'radial-gradient(circle, rgba(114, 196, 185, 0.35) 0%, rgba(16, 185, 129, 0.12) 60%, transparent 80%)',
            }}
          />

          {/* Central Logo with subtle breathing pulse */}
          <img
            src={logoUrl}
            alt="Cashio"
            className="cashio-logo-animated w-12 h-12 sm:w-14 sm:h-14 object-contain select-none"
            style={{
              maxHeight: '58px',
              maxWidth: '58px',
            }}
          />
        </div>
      </div>

      {/* ================= Loading Text & Sequential Wave Dots ================= */}
      {showText && (
        <div className="flex flex-col items-center justify-center gap-3 mt-1 z-10">
          <span
            className="text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors duration-300"
            style={{
              color: isDark ? '#72C4B9' : '#0D7A6D',
              letterSpacing: '0.22em',
              textShadow: isDark
                ? '0 0 12px rgba(114, 196, 185, 0.45)'
                : '0 0 8px rgba(13, 122, 109, 0.25)',
            }}
          >
            {text}
          </span>

          {/* 6 Sequential Wave Pulsing Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <span
                key={index}
                className="cashio-wave-dot inline-block w-2 h-2 rounded-full"
                style={{
                  animationDelay: `${index * 0.18}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen || size === 'fullscreen') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: isDark ? '#02221D' : 'var(--bg-primary, #EEF6F3)',
        }}
      >
        {/* Subtle grid background to match Cashio aesthetic */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(rgba(114, 196, 185, 0.18) 1.2px, transparent 1.2px)'
              : 'radial-gradient(rgba(13, 122, 109, 0.2) 1.2px, transparent 1.2px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 95%)',
          }}
        />
        {content}
      </div>
    );
  }

  return content;
};

export default CashioOrbitalLoader;
