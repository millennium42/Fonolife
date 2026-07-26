import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}

export function Sidebar({ children, label = "Navegação principal" }: { children: ReactNode; label?: string }) {
  return <nav aria-label={label}>{children}</nav>;
}

export function TopBar({ children }: { children: ReactNode }) {
  return <header>{children}</header>;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return <div className="title"><h1>{title}</h1>{actions}</div>;
}

export function QuickActions(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`actions ${props.className ?? ""}`.trim()} />;
}

export function Button({ variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "secondary" | "danger" | "outline" }) {
  return <button {...props} className={[variant, props.className].filter(Boolean).join(" ")} />;
}

export function IconButton({ label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <Button {...props} aria-label={label} title={props.title ?? label} />;
}

export function Modal({
  children,
  label,
  onClose,
  size = "medium",
  className = "",
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    (focusable()[0] ?? dialog)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`modal-content modal-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ label, message, onConfirm, onClose }: { label: string; message: string; onConfirm: () => void; onClose: () => void }) {
  return <Modal label={label} onClose={onClose} size="small"><p>{message}</p><QuickActions><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onConfirm}>Confirmar</Button></QuickActions></Modal>;
}

export function FormModal({ children, ...props }: Parameters<typeof Modal>[0]) {
  return <Modal {...props}>{children}</Modal>;
}

export function Drawer({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"][aria-modal="true"]')) {
        closeRef.current();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, []);
  return <aside ref={drawerRef} className="drawer" aria-label={label} tabIndex={-1}>{children}</aside>;
}

export function Card(props: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`card ${props.className ?? ""}`.trim()} />;
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return <Card className="kpi-card"><span>{label}</span><strong>{value}</strong></Card>;
}

export function DataTable(props: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="table-scroll" role="region" aria-label={props["aria-label"] ?? "Tabela de dados"} tabIndex={0}><table {...props} /></div>;
}

export function Badge({ tone = "info", children }: { tone?: "success" | "warning" | "danger" | "info"; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function FilterBar(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`filter-bar ${props.className ?? ""}`.trim()} />;
}

export function Tabs(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`tabs ${props.className ?? ""}`.trim()} role="tablist" />;
}

export function Toast({ tone = "success", children }: { tone?: "success" | "error"; children: ReactNode }) {
  return <p className={tone} role="status">{children}</p>;
}

export function EmptyState({ children = "Nenhum registro encontrado." }: { children?: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function ErrorState({ children }: { children: ReactNode }) {
  return <p className="error" role="alert">{children}</p>;
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return <div className="loading-state" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />{label}</div>;
}

export function Skeleton() {
  return <span className="skeleton" aria-hidden="true" />;
}

export function PatientLink({ patientId, name, onOpen }: { patientId: string; name: string; onOpen: (id: string) => void }) {
  return <button type="button" className="patient-link" onClick={(event) => { event.stopPropagation(); onOpen(patientId); }}>{name}</button>;
}
