"use client";

import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Activity,
  LayoutDashboard,
  Settings,
  Shield,
  Terminal,
  UserX,
  LogOut,
  Moon,
  Sun,
  LayoutTemplate
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inativos",
    url: "/inativos",
    icon: UserX,
  },
  {
    title: "Inadimplência",
    url: "/inadimplencia",
    icon: AlertCircle,
  },
  {
    title: "Monitoramento",
    url: "/monitoramento",
    icon: Activity,
  },
  {
    title: "Logs do Servidor",
    url: "/logs",
    icon: Terminal,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
  {
    title: "Administração",
    url: "/administracao",
    icon: Shield,
  },
];

export function SideBar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="pt-6 pb-2 px-6">
        <div className="flex items-center gap-3 text-sidebar-foreground">
          <LayoutTemplate className="size-5 text-muted-foreground" />
          <span className="font-medium text-base">Navigation</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                // Determine active state. For previewing the exact state from image, we could default true for /inativos
                const isActive = pathname === item.url || (pathname === "/" && item.url === "/inativos");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      render={<a href={item.url} className="flex items-center gap-3" />}
                      isActive={isActive} 
                      tooltip={item.title}
                      className="h-10 text-base"
                    >
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-14"
                  />
                }
              >
                  <Avatar className="h-9 w-9 rounded-full border border-gray-200 dark:border-zinc-800">
                    <AvatarFallback className="bg-transparent text-sm">K</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                    <span className="truncate font-medium text-sm">Kaique Roque</span>
                    <span className="truncate text-xs text-muted-foreground">kaique.roque@alphanacional.com.br</span>
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={14}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-full border border-gray-200 dark:border-zinc-800">
                      <AvatarFallback className="bg-transparent text-sm">K</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Kaique Roque</span>
                      <span className="truncate text-xs text-muted-foreground">kaique.roque@alphanacional.com.br</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
                  Mudar Tema
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={() => console.log('Deslogar')}>
                  <LogOut className="mr-2 size-4" />
                  Deslogar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
