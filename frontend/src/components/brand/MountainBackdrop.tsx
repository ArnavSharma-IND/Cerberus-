import React from 'react';

interface MountainBackdropProps {
  className?: string;
  opacity?: number;
}

export const MountainBackdrop: React.FC<MountainBackdropProps> = ({
  className = '',
  opacity = 0.85,
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full"
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="720" y1="0" x2="720" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#EDE9FE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F5F3FF" stopOpacity="1" />
          </linearGradient>

          {/* Far Mountain Facets */}
          <linearGradient id="farPeakLeft" x1="0" y1="180" x2="350" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="farPeakRight" x1="350" y1="180" x2="700" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.1" />
          </linearGradient>

          {/* Center Main Peak Facets */}
          <linearGradient id="centerPeakLeft" x1="450" y1="120" x2="720" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="centerPeakRight" x1="720" y1="120" x2="990" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.15" />
          </linearGradient>

          {/* Mid Ridge Facets */}
          <linearGradient id="midRidge" x1="0" y1="300" x2="1440" y2="550" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.2" />
          </linearGradient>

          {/* Sun / Core Radiant Bloom */}
          <radialGradient id="sunGlow" cx="720" cy="220" r="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Sky Fill */}
        <rect width="1440" height="600" fill="url(#skyGrad)" />

        {/* Radiant Center Glow behind mountain peaks */}
        <circle cx="720" cy="220" r="320" fill="url(#sunGlow)" />

        {/* Subtle Constellation / Grid Marks */}
        <g opacity="0.4">
          <circle cx="280" cy="110" r="1.5" fill="#8B5CF6" />
          <circle cx="420" cy="70" r="1.2" fill="#8B5CF6" />
          <circle cx="980" cy="85" r="1.5" fill="#8B5CF6" />
          <circle cx="1180" cy="130" r="1.8" fill="#8B5CF6" />
          <line x1="280" y1="110" x2="420" y2="70" stroke="#C4B5FD" strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="980" y1="85" x2="1180" y2="130" stroke="#C4B5FD" strokeWidth="0.5" strokeDasharray="2 4" />
        </g>

        {/* --- FAR BACKGROUND MOUNTAIN SILHOUETTE (Left & Right Spans) --- */}
        {/* Far Left Peak */}
        <polygon points="-60,480 180,240 360,340 520,270 660,420 -60,540" fill="url(#farPeakLeft)" />
        {/* Far Right Peak */}
        <polygon points="780,420 940,260 1120,330 1280,220 1500,480 1500,560 780,560" fill="url(#farPeakRight)" />

        {/* --- MAJESTIC CENTER ALPHA PEAKS (Polygonal Facets) --- */}
        {/* Left Sunlit Flank of Main Summit */}
        <polygon points="720,130 540,310 630,420 720,380" fill="url(#centerPeakLeft)" />
        {/* Right Shadowed Flank of Main Summit */}
        <polygon points="720,130 720,380 810,430 910,290" fill="url(#centerPeakRight)" />
        {/* West Shoulder Peak */}
        <polygon points="540,310 410,380 490,460 630,420" fill="#DDD6FE" fillOpacity="0.45" />
        {/* East Shoulder Peak */}
        <polygon points="910,290 810,430 960,460 1040,370" fill="#C4B5FD" fillOpacity="0.45" />
        {/* Ridge Spine Accent Lines */}
        <line x1="720" y1="130" x2="720" y2="380" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="720" y1="130" x2="540" y2="310" stroke="#DDD6FE" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="720" y1="130" x2="910" y2="290" stroke="#C4B5FD" strokeWidth="1" strokeOpacity="0.6" />

        {/* --- MIDGROUND FOOTHILLS & VALLEYS --- */}
        <path
          d="M-20 450 L160 380 L320 420 L480 370 L640 430 L800 390 L980 440 L1160 380 L1320 420 L1460 370 L1460 600 L-20 600 Z"
          fill="url(#midRidge)"
        />

        {/* --- FOREGROUND MIST & BASE DISSOLVE TO CANVAS (#F5F3FF) --- */}
        <rect y="440" width="1440" height="160" fill="url(#skyGrad)" opacity="0.95" />
        <path
          d="M0 480 Q 360 440, 720 470 T 1440 460 L 1440 600 L 0 600 Z"
          fill="#F5F3FF"
          fillOpacity="0.75"
        />
      </svg>
    </div>
  );
};