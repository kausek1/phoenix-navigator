import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutGrid, Calculator, KanbanSquare, BarChart3, LogOut, Menu, X, Flame } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import RoleBadge from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "X-Matrix", url: "/xmatrix", icon: LayoutGrid },
  { title: "WSJF Scoring", url: "/wsjf", icon: Calculator },
  { title: "Kanban Board", url: "/kanban", icon: KanbanSquare },
  { title: "Portfolio", url: "/portfolio", icon: BarChart3 },
];

const Sidebar = ({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) => {
  const location = useLocation();

  return (
    <aside className={`${mobile ? "w-64" : "hidden md:flex w-60"} flex-col bg-primary text-primary-foreground h-full`}>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg gradient-phoenix flex items-center justify-center flex-shrink-0">
          <Flame className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm tracking-widest">PHOENIX</span>
        {mobile && (
          <Button variant="ghost" size="icon" className="ml-auto text-primary-foreground" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
          return (
            <RouterNavLink
              key={item.url}
              to={item.url}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-accent border-l-[3px] border-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.title}</span>
            </RouterNavLink>
          );
        })}
      </nav>
    </aside>
  );
};

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { profile, client, role, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {client && <span className="font-semibold text-primary text-sm">{client.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <>
                <span className="text-sm text-foreground hidden sm:inline">{profile.full_name}</span>
                {role && <RoleBadge role={role} />}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
