import { Link } from "react-router-dom";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#C8472B" />
      <circle cx="32" cy="32" r="20" fill="#FFF9F1" />
      <path d="M32 12v20l14 10" stroke="#24211E" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="32" r="4" fill="#F4B942" />
    </svg>
  );
}

export function BrandLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-full" aria-label="Makan Apa — home">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">Makan Apa</span>
    </Link>
  );
}
