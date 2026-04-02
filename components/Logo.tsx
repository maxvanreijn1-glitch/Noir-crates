export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Noir Crates logo"
    >
      {/* Box body */}
      <rect x="6" y="18" width="28" height="18" rx="3" fill="#8B9E89" opacity="0.85" />
      {/* Box lid */}
      <rect x="4" y="13" width="32" height="7" rx="3" fill="#7A8E78" />
      {/* Ribbon horizontal */}
      <rect x="4" y="16" width="32" height="2" rx="1" fill="#F5F0E8" opacity="0.6" />
      {/* Ribbon vertical */}
      <rect x="19" y="13" width="2" height="23" rx="1" fill="#F5F0E8" opacity="0.6" />
      {/* Glow from inside */}
      <ellipse cx="20" cy="18" rx="6" ry="3" fill="#9BAFC0" opacity="0.5" />
      {/* Question mark hint */}
      <text x="17" y="31" fontFamily="Georgia, serif" fontSize="11" fill="#F5F0E8" opacity="0.7">?</text>
    </svg>
  );
}
