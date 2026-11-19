export function LogoMark({ width = 52 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={(width * 40) / 120} viewBox="0 0 120 40" style={{ filter: "drop-shadow(0 0 6px rgba(255,87,46,0.55))" }}>
      <defs>
        <linearGradient id="alive-mark" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#FF9A2E" />
          <stop offset="0.55" stopColor="#F97316" />
          <stop offset="1" stopColor="#E5281C" />
        </linearGradient>
      </defs>
      <path d="M33 30 C43 22 47 3 60 3 C73 3 77 22 87 30 C77 22 69 17 60 17 C51 17 43 22 33 30 Z" fill="url(#alive-mark)" />
      <path d="M3 37 C30 35 46 23 60 23 C74 23 90 35 117 37 Z" fill="url(#alive-mark)" />
    </svg>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="font-sans font-bold leading-none" style={{ fontSize: size, letterSpacing: "-0.035em" }}>
      al
      <span className="relative">
        ı
        <span aria-hidden="true" className="absolute rounded-full bg-vermilion" style={{ left: "50%", top: "0.02em", width: "0.24em", height: "0.24em", marginLeft: "-0.12em" }} />
      </span>
      ve
    </span>
  );
}
