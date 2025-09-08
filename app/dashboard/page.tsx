"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  CreditCard, 
  FolderOpen, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { getUserContextViaAPI } from "@/lib/auth-client";
import { getOrganizationProjects } from "@/lib/projects-client";
import { getCreditsAnalytics } from "@/lib/credits-client";
import type { UserContext, Project, VideoJob } from "@/lib/types";

export default function DashboardPage() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const context = await getUserContextViaAPI();
        setUserContext(context);
        
        if (context?.current_organization) {
          const [projectsData, analyticsData] = await Promise.all([
            getOrganizationProjects(context.current_organization.id),
            getCreditsAnalytics(context.current_organization.id)
          ]);
          
          if (projectsData.success) {
            setProjects(projectsData.data || []);
          }
          
          if (analyticsData.success) {
            setAnalytics(analyticsData.data);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userContext?.current_organization) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Bienvenido a IA-Marketing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Para comenzar, necesitas crear o unirte a una organización.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                Crear Organización
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizations/join">
                Unirse a Organización
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const org = userContext.current_organization;
  const recentProjects = projects.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bienvenido de vuelta, {userContext.profile?.full_name || "Usuario"}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button asChild>
              <Link href="/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/videos/create">
                <Video className="mr-2 h-4 w-4" />
                Generar Video
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Disponibles</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org.wallet?.balance || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.usedCredits || 0} usados este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                {org.projects.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org.members.length}</div>
              <p className="text-xs text-muted-foreground">
                En la organización
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos Generados</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, project) => sum + (project as any).video_count || 0, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Recientes</CardTitle>
              <CardDescription>
                Tus proyectos más recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Creado {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/projects/${project.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No tienes proyectos aún
                  </p>
                  <Button asChild>
                    <Link href="/projects/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primer Proyecto
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas acciones en tu organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Organización creada</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {projects.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Primer proyecto creado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(projects[0].created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/videos/create">
                  <Video className="h-6 w-6 mb-2" />
                  Generar Video
                </Link>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/projects/create">
                  <Plus className="h-6 w-6 mb-2" />
                  Nuevo Proyecto
                </Link>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/members/invite">
                  <Users className="h-6 w-6 mb-2" />
                  Invitar Miembro
                </Link>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/credits">
                  <CreditCard className="h-6 w-6 mb-2" />
                  Gestionar Créditos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
