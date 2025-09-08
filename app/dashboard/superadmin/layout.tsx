"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getUserContextViaAPI } from "@/lib/auth-client";
import type { UserContext } from "@/lib/types";

interface SuperadminLayoutProps {
  children: React.ReactNode;
}

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSuperadminAccess() {
      try {
        const context = await getUserContextViaAPI();
        setUserContext(context);
        
        // Check if user is superadmin
        if (!context?.is_superadmin) {
          // Redirect to dashboard if not superadmin
          router.push('/dashboard');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking superadmin access:", error);
        router.push('/dashboard');
      }
    }

    checkSuperadminAccess();
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permisos de Super Admin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userContext?.is_superadmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">No tienes permisos de Super Admin para acceder a esta sección.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
