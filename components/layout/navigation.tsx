"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Menu,
  X,
  Building2,
  FolderOpen,
  Zap,
  Crown,
} from "lucide-react";

interface NavigationProps {
  userContext?: {
    user: any;
    profile: any;
    organizations: any[];
    current_organization: any;
    is_superadmin: boolean;
  } | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Proyectos", href: "/projects", icon: FolderOpen },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Miembros", href: "/members", icon: Users },
  { name: "Créditos", href: "/credits", icon: CreditCard },
];

const superadminNavigation = [
  { name: "Organizaciones", href: "/dashboard/superadmin/organizations", icon: Building2 },
  { name: "Prompts Globales", href: "/dashboard/superadmin/prompts", icon: Zap },
  { name: "Configuración", href: "/dashboard/superadmin/settings", icon: Settings },
];

export function Navigation({ userContext }: NavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const currentOrg = userContext?.current_organization;

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">IA-Marketing</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
            {userContext?.is_superadmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Superadmin
                  </p>
                </div>
                {superadminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        isActive(item.href)
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {userContext?.profile?.full_name?.charAt(0) || userContext?.user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userContext?.profile?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userContext?.user?.email}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">IA-Marketing</span>
            </Link>
          </div>
          
          {/* Organization selector */}
          {currentOrg && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="truncate">{currentOrg.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userContext?.organizations?.map((org) => (
                    <DropdownMenuItem key={org.id} asChild>
                      <Link href={`/dashboard?org=${org.id}`}>
                        <Building2 className="mr-2 h-4 w-4" />
                        {org.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
            {userContext?.is_superadmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                    <Crown className="mr-1 h-3 w-3" />
                    Superadmin
                  </p>
                </div>
                {superadminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        isActive(item.href)
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {userContext?.profile?.full_name?.charAt(0) || userContext?.user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userContext?.profile?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userContext?.user?.email}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <LogoutButton />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">IA-Marketing</span>
          </Link>
          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
