import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-line/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75 sticky top-0 z-[1100]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo />
        <nav className="flex items-center gap-1 text-sm font-medium">{children}</nav>
      </div>
    </header>
  );
}
