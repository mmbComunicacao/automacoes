"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserX,
  AlertCircle,
  Settings,
  Shield,
  Terminal,
  Moon,
  Sun,
  LogOut,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard",     url: "/dashboard",    icon: LayoutDashboard },
  { title: "Inativos",      url: "/inativos",     icon: UserX           },
  { title: "Inadimplência", url: "/inadimplentes",icon: AlertCircle     },
];

const adminItems = [
  { title: "Configurações",   url: "/configuracoes",    icon: Settings  },
  { title: "Administração",   url: "/administracao",    icon: Shield    },
  { title: "Logs do Servidor",url: "/administracao/logs",icon: Terminal },
];

export function SideBar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Cabeçalho com identidade do sistema */}
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shrink-0">
            <Zap className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight text-sidebar-foreground">
              Automações
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Alpha Nacional
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Grupo principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Automações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (pathname === "/" && item.url === "/dashboard");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<a href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-9 rounded-lg text-sm font-medium gap-3 px-3 transition-colors"
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo de administração */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {adminItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<a href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-9 rounded-lg text-sm font-medium gap-3 px-3 transition-colors"
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Rodapé com usuário */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-12 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border shrink-0">
                  <AvatarFallback className="rounded-lg bg-blue-600 text-white text-xs font-semibold">
                    KR
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-xs">Kaique Roque</span>
                  <span className="truncate text-xs text-muted-foreground">
                    kaique.roque@alphanacional.com.br
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-lg"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left">
                    <Avatar className="h-8 w-8 rounded-lg border">
                      <AvatarFallback className="rounded-lg bg-blue-600 text-white text-xs font-semibold">
                        KR
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Kaique Roque</span>
                      <span className="truncate text-xs text-muted-foreground">
                        kaique.roque@alphanacional.com.br
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-red-600 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                  onClick={() => console.log("Deslogar")}
                >
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
