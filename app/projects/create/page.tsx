"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createProject } from "@/lib/projects";
import { getUserContextViaAPI } from "@/lib/auth-client";
import type { CreateProjectForm, UserContext } from "@/lib/types";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [form, setForm] = useState<CreateProjectForm>({
    name: "",
    organization_id: ""
  });

  useEffect(() => {
    async function loadUserContext() {
      const context = await getUserContextViaAPI();
      setUserContext(context);
      
      if (context?.current_organization) {
        setForm(prev => ({
          ...prev,
          organization_id: context.current_organization!.id
        }));
      }
    }

    loadUserContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createProject(form);
      
      if (result.success && result.data) {
        // Redirect to the new project
        router.push(`/projects/${result.data.id}`);
      } else {
        alert(result.error || "Error al crear el proyecto");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error inesperado al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userContext.current_organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No tienes una organización
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas crear o unirte a una organización para crear proyectos.
          </p>
          <Button asChild>
            <Link href="/organizations/create">
              Crear Organización
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
          
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Crear Proyecto
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crea un nuevo proyecto para organizar tus videos publicitarios
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
            <CardDescription>
              Proporciona los detalles básicos de tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre del Proyecto</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Lanzamiento Primavera 2024"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Elige un nombre descriptivo para tu proyecto
                </p>
              </div>

              <div>
                <Label>Organización</Label>
                <div className="mt-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                        {userContext.current_organization.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {userContext.current_organization.name}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El proyecto se creará en esta organización
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  ¿Qué puedes hacer en un proyecto?
                </h4>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <li>• Generar videos publicitarios</li>
                  <li>• Invitar miembros del equipo</li>
                  <li>• Establecer límites de créditos mensuales</li>
                  <li>• Organizar videos por campaña</li>
                  <li>• Colaborar con tu equipo</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Proyecto"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Al crear un proyecto, te convertirás automáticamente en su propietario
          </p>
        </div>
      </div>
    </div>
  );
}
