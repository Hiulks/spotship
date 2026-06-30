import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-900/50 p-5", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="mt-1 text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-800",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/20 text-indigo-300",
    green: "bg-green-500/20 text-green-300",
    red: "bg-red-500/20 text-red-300",
    yellow: "bg-yellow-500/20 text-yellow-300",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors[color] || colors.indigo)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center py-12">
      <h3 className="text-lg font-medium text-slate-300">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Card>
  );
}
