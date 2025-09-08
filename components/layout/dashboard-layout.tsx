"use client";

import { useEffect, useState } from "react";
import { Navigation } from "./navigation";
import { getUserContextViaAPI } from "@/lib/auth-client";
import type { UserContext } from "@/lib/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserContext() {
      try {
        const context = await getUserContextViaAPI();
        setUserContext(context);
      } catch (error) {
        console.error("Error loading user context:", error);
        // Set userContext to null to show the unauthorized message
        setUserContext(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserContext();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso no autorizado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation userContext={userContext} />
      
      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {/* Organization info */}
              {userContext.current_organization && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                        {userContext.current_organization.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userContext.current_organization.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userContext.current_organization.wallet?.balance || 0} créditos disponibles
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center space-x-4">
              {userContext.current_organization && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{userContext.current_organization.projects.length} proyectos</span>
                  <span>•</span>
                  <span>{userContext.current_organization.members.length} miembros</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
