"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  UserX,
  AlertCircle,
  Settings,
  Shield,
  Terminal,
} from "lucide-react";

const breadcrumbMap: Record<string, { label: string; icon: React.ElementType }> = {
  "/dashboard":        { label: "Dashboard",        icon: LayoutDashboard },
  "/inativos":         { label: "Inativos",          icon: UserX           },
  "/inadimplentes":    { label: "Inadimplência",     icon: AlertCircle     },
  "/configuracoes":    { label: "Configurações",     icon: Settings        },
  "/administracao":    { label: "Administração",     icon: Shield          },
  "/administracao/logs": { label: "Logs do Servidor", icon: Terminal       },
};

export function Header() {
  const pathname = usePathname();
  const current = breadcrumbMap[pathname];

  if (!current) return null;

  const Icon = current.icon;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-10">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4 mx-1" />
      <div className="flex items-center gap-2 text-sm">
        <Icon className="size-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{current.label}</span>
      </div>
    </header>
  );
}
