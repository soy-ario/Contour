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
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F4F4FA]">
      <AdminTopbar title={title} breadcrumbs={breadcrumbs} user={user} />
      <main className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        {actions && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div />
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        )}
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
