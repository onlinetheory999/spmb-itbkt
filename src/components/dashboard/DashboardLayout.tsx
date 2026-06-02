import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, Bell } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Outlet } from "react-router-dom";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function DashboardLayout({
  items, title,
}: { items: NavItem[]; title: string }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar items={items} title={title} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar title={title} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ items, title }: { items: NavItem[]; title: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-bold truncate">{title}</span>
              <span className="text-[10px] text-muted-foreground truncate">PKBM Ibnu Taimiyah</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(it.to + "/");
                return (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={active}
                      className={active ? "bg-primary/10 text-primary font-medium" : ""}>
                      <Link to={it.to} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{it.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function TopBar({ title }: { title: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Anda telah keluar");
    nav("/");
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur flex items-center gap-3 px-4 md:px-6">
      <SidebarTrigger />
      <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col leading-tight max-w-[160px]">
            <span className="text-xs font-medium truncate">{user?.email}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
