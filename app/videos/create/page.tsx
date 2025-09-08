"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Video, ArrowLeft, Loader2, Zap, Edit3, FileText } from "lucide-react";
import Link from "next/link";
import { getUserContextViaAPI } from "@/lib/auth-client";
import { getOrganizationProjects } from "@/lib/projects-client";
import { getCreditsPerVideo } from "@/lib/credits-client";
import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserContext, Project, Prompt, CreateVideoJobForm } from "@/lib/types";

export default function CreateVideoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [creditsPerVideo, setCreditsPerVideo] = useState(10);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [form, setForm] = useState<CreateVideoJobForm>({
    project_id: "",
    prompt_text: "",
    parameters: {
      duration: 15,
      aspect_ratio: "16:9",
      style: "modern"
    }
  });

  useEffect(() => {
    async function loadData() {
      const context = await getUserContextViaAPI();
      setUserContext(context);
      
      if (context?.current_organization) {
        const [projectsData, creditsData] = await Promise.all([
          getOrganizationProjects(context.current_organization.id),
          getCreditsPerVideo()
        ]);
        
        if (projectsData.success) {
          setProjects(projectsData.data || []);
        }
        
        if (creditsData.success) {
          setCreditsPerVideo(creditsData.data || 10);
        }
        
        // Load global prompts
        const supabase = createAdminClient(); // Use admin client to bypass RLS
        const { data: promptsData } = await supabase
          .from('prompts')
          .select('*')
          .eq('scope', 'global')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        
        setPrompts(promptsData || []);
      }
    }

    loadData();
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setForm(prev => ({
      ...prev,
      prompt_text: prompt.content
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createAdminClient(); // Use admin client for RPC calls
      const { data, error } = await supabase.rpc('create_video_job_rpc', {
        p_project_id: form.project_id,
        p_prompt_id: selectedPrompt?.id || null,
        p_prompt_version: selectedPrompt?.version || null,
        p_prompt_text_final: form.prompt_text,
        p_parameters: form.parameters
      });
      
      if (error) {
        alert(error.message || "Error al crear el video");
        return;
      }
      
      // Redirect to the video job
      router.push(`/videos/${data}`);
    } catch (error) {
      console.error("Error creating video job:", error);
      alert("Error inesperado al crear el video");
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
            Necesitas crear o unirte a una organización para generar videos.
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

  const selectedProject = projects.find(p => p.id === form.project_id);
  const hasCredits = (userContext.current_organization.wallet?.balance || 0) >= creditsPerVideo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
          
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Generar Video Publicitario
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crea videos publicitarios profesionales usando inteligencia artificial
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Video</CardTitle>
                <CardDescription>
                  Configura los parámetros para tu video publicitario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Selection */}
                  <div>
                    <Label htmlFor="project">Proyecto</Label>
                    <Select
                      value={form.project_id}
                      onValueChange={(value) => setForm(prev => ({ ...prev, project_id: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona un proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!form.project_id && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Primero necesitas crear un proyecto
                      </p>
                    )}
                  </div>

                  {/* Prompt Selection */}
                  <div>
                    <Label>Prompt para el Video</Label>
                    <Tabs defaultValue="templates" className="mt-1">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="templates" className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Plantillas</span>
                        </TabsTrigger>
                        <TabsTrigger value="customize" className="flex items-center space-x-2">
                          <Edit3 className="h-4 w-4" />
                          <span>Personalizar</span>
                        </TabsTrigger>
                        <TabsTrigger value="from-scratch" className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Desde Cero</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="templates" className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          {prompts.map((prompt) => (
                            <div
                              key={prompt.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedPrompt?.id === prompt.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                              onClick={() => handlePromptSelect(prompt)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{prompt.title}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {prompt.description}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="ml-2">
                                  v{prompt.version}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="customize">
                        <div className="space-y-3">
                          <Label>Prompt Base</Label>
                          <Select
                            value={selectedPrompt?.id || ""}
                            onValueChange={(value) => {
                              const prompt = prompts.find(p => p.id === value);
                              if (prompt) handlePromptSelect(prompt);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un prompt base" />
                            </SelectTrigger>
                            <SelectContent>
                              {prompts.map((prompt) => (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                  {prompt.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Label>Personaliza el Prompt</Label>
                          <Textarea
                            value={form.prompt_text}
                            onChange={(e) => setForm(prev => ({ ...prev, prompt_text: e.target.value }))}
                            placeholder="Modifica el prompt base según tus necesidades..."
                            rows={6}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="from-scratch">
                        <div>
                          <Label>Escribe tu Prompt</Label>
                          <Textarea
                            value={form.prompt_text}
                            onChange={(e) => setForm(prev => ({ ...prev, prompt_text: e.target.value }))}
                            placeholder="Describe el video que quieres generar. Sé específico sobre el producto, el estilo, la duración y cualquier elemento visual que desees incluir..."
                            rows={6}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Video Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duración (segundos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="30"
                        value={form.parameters.duration}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, duration: parseInt(e.target.value) }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="aspect_ratio">Aspecto</Label>
                      <Select
                        value={form.parameters.aspect_ratio}
                        onValueChange={(value) => setForm(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, aspect_ratio: value as any }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                          <SelectItem value="1:1">1:1 (Cuadrado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={loading || !form.project_id || !form.prompt_text.trim() || !hasCredits}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 h-4 w-4" />
                          Generar Video ({creditsPerVideo} créditos)
                        </>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credits Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles:</span>
                    <span className="font-medium">{userContext.current_organization.wallet?.balance || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Costo por video:</span>
                    <span className="font-medium">{creditsPerVideo}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Después de generar:</span>
                      <span className="font-medium">
                        {(userContext.current_organization.wallet?.balance || 0) - creditsPerVideo}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!hasCredits && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      No tienes suficientes créditos para generar un video.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/credits">
                        Gestionar Créditos
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            {selectedProject && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600 dark:text-green-300">
                          {selectedProject.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{selectedProject.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Creado {new Date(selectedProject.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium">Para mejores resultados:</h4>
                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Sé específico sobre el producto</li>
                      <li>• Menciona el público objetivo</li>
                      <li>• Incluye el tono deseado</li>
                      <li>• Especifica elementos visuales</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
