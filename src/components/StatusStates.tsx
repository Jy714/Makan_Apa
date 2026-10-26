import { AlertCircle, Loader2, SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-tomato" aria-hidden="true" />
      <p className="font-semibold">{title}</p>
      {detail && <p className="max-w-sm text-sm text-muted">{detail}</p>}
    </div>
  );
}

export function PlaceSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-line bg-surface p-4">
          <div className="h-4 w-2/3 rounded bg-line" />
          <div className="mt-2 h-3 w-1/3 rounded bg-line/70" />
          <div className="mt-4 h-8 w-1/2 rounded-full bg-line/60" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center" role="status">
      <SearchX className="h-9 w-9 text-muted" aria-hidden="true" />
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorState({ title, message, actions }: { title: string; message: string; actions?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 border-danger/30 p-8 text-center" role="alert">
      <AlertCircle className="h-9 w-9 text-danger" aria-hidden="true" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
