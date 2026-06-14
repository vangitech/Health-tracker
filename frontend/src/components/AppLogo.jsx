export function AppLogo({ size = 36, showText = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="url(#logo-grad)" fillOpacity="0.15" />
        <g transform="translate(8, 6)">
          <path
            d="M10 24C4.477 24 0 19.523 0 14C0 8.477 4.477 0 10 0C15.523 0 20 8.477 20 14C20 19.523 15.523 24 10 24Z"
            fill="#38bdf8"
            fillOpacity="0.25"
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          <path
            d="M10 20C6.686 20 4 17.314 4 14C4 10.686 6.686 6 10 6C13.314 6 16 10.686 16 14C16 17.314 13.314 20 10 20Z"
            fill="#38bdf8"
            fillOpacity="0.15"
            stroke="#38bdf8"
            strokeWidth="0.8"
          />
          <path
            d="M10 16C8.895 16 8 15.105 8 14C8 12.895 8.895 12 10 12C11.105 12 12 12.895 12 14C12 15.105 11.105 16 10 16Z"
            fill="#60a5fa"
          />
          <line x1="10" y1="6" x2="10" y2="0" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="14" x2="0" y2="14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="14" x2="20" y2="14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M10 0L8 3H12L10 0Z"
            fill="#38bdf8"
          />
          <path
            d="M4 10L2 12L6 12L4 10Z"
            fill="#38bdf8"
            fillOpacity="0.6"
          />
          <path
            d="M16 10L14 12H18L16 10Z"
            fill="#38bdf8"
            fillOpacity="0.6"
          />
        </g>
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-white tracking-tight">SugarTrack</span>
          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-[0.15em]">Glucose Tracker</span>
        </div>
      )}
    </div>
  );
}
