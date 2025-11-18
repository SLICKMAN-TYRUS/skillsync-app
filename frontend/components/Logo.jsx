import React from 'react';

// Simple inline SVG logo component used on web and native (web will render SVG, native will render as fallback text)
export default function Logo({ width = 120, height = 48 }) {
  const style = { width, height, display: 'block' };
  return (
    <svg viewBox="0 0 300 80" style={style} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SkillSync logo">
      <rect width="100%" height="100%" rx="6" fill="#2b75f6" />
      <g transform="translate(18,50)">
        <path d="M0-6 c18 0 28-12 40-18 10-5 24-6 34 0 10 6 26 20 44 20" fill="#fff" opacity="0.95" />
      </g>
      <text x="120" y="48" fontFamily="Arial, Helvetica, sans-serif" fontSize="32" fontWeight="700" fill="#ffffff">SkillSync</text>
    </svg>
  );
}
