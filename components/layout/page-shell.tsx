"use client";

import AdminTopbar, { type Breadcrumb } from "./admin-topbar";

interface PageShellProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  user: {
    name: string;
    email: string;
    username: string;
  };
  children: React.ReactNode;
}

export default function PageShell({
  title,
  breadcrumbs = [],
  actions,
  user,
  children,
}: PageShellProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <AdminTopbar title={title} breadcrumbs={breadcrumbs} user={user} />
      
      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Header Action Row (if actions are provided) */}
        {actions && (
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              {breadcrumbs.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scope operations for {title?.toLowerCase() || "dashboard"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        )}

        {/* Child Page Content */}
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
