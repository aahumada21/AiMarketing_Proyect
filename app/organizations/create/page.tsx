"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createOrganization } from "@/lib/organizations";
import type { CreateOrganizationForm } from "@/lib/types";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateOrganizationForm>({
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createOrganization(form);
      
      if (result.success && result.data) {
        // Redirect to dashboard with the new organization
        router.push(`/dashboard?org=${result.data.id}`);
      } else {
        alert(result.error || "Error al crear la organización");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Error inesperado al crear la organización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
          
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Crear Organización
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crea una nueva organización para comenzar a generar videos publicitarios
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Organización</CardTitle>
            <CardDescription>
              Proporciona los detalles básicos de tu organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre de la Organización</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mi Empresa S.A."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este nombre será visible para todos los miembros de la organización
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ¿Qué incluye tu organización?
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Gestión de proyectos y equipos</li>
                  <li>• Sistema de créditos para generación de videos</li>
                  <li>• Biblioteca de prompts personalizables</li>
                  <li>• Almacenamiento seguro de videos generados</li>
                  <li>• Panel de administración completo</li>
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
                    "Crear Organización"
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
            Al crear una organización, te convertirás automáticamente en su administrador
          </p>
        </div>
      </div>
    </div>
  );
}
