"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Plus, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { getGlobalPrompts, createPrompt, updatePrompt } from "@/lib/prompts-client";
import type { Prompt, CreatePromptForm } from "@/lib/types";

export default function SuperadminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [form, setForm] = useState<CreatePromptForm>({
    scope: 'global',
    title: '',
    description: '',
    content: '',
    variables: []
  });

  useEffect(() => {
    async function loadData() {
      await loadPrompts();
      setLoading(false);
    }

    loadData();
  }, []);

  const loadPrompts = async () => {
    try {
      const result = await getGlobalPrompts();
      
      if (result.success) {
        setPrompts(result.data || []);
      } else {
        console.error('Error loading prompts:', result.error);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (editingPrompt) {
        // Update existing prompt
        result = await updatePrompt(
          editingPrompt.id,
          form,
          editingPrompt.version + 1,
          false // New version starts as draft
        );
      } else {
        // Create new prompt
        result = await createPrompt(form);
      }

      if (result.success) {
        await loadPrompts();
        setDialogOpen(false);
        setEditingPrompt(null);
        setForm({
          scope: 'global',
          title: '',
          description: '',
          content: '',
          variables: []
        });
      } else {
        console.error('Error saving prompt:', result.error);
        alert('Error al guardar el prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error al guardar el prompt');
    }
  };

  const handlePublish = async (promptId: string) => {
    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      const result = await updatePrompt(
        promptId,
        {
          scope: prompt.scope,
          title: prompt.title,
          description: prompt.description || '',
          content: prompt.content,
          variables: prompt.variables
        },
        prompt.version,
        true
      );

      if (result.success) {
        await loadPrompts();
      } else {
        console.error('Error publishing prompt:', result.error);
        alert('Error al publicar el prompt');
      }
    } catch (error) {
      console.error('Error publishing prompt:', error);
      alert('Error al publicar el prompt');
    }
  };

  const handleUnpublish = async (promptId: string) => {
    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      const result = await updatePrompt(
        promptId,
        {
          scope: prompt.scope,
          title: prompt.title,
          description: prompt.description || '',
          content: prompt.content,
          variables: prompt.variables
        },
        prompt.version,
        false
      );

      if (result.success) {
        await loadPrompts();
      } else {
        console.error('Error unpublishing prompt:', result.error);
        alert('Error al despublicar el prompt');
      }
    } catch (error) {
      console.error('Error unpublishing prompt:', error);
      alert('Error al despublicar el prompt');
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setForm({
      scope: prompt.scope,
      title: prompt.title,
      description: prompt.description || '',
      content: prompt.content,
      variables: prompt.variables
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Prompts Globales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona los prompts preconfigurados disponibles para todos los usuarios
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPrompt(null);
                setForm({
                  scope: 'global',
                  title: '',
                  description: '',
                  content: '',
                  variables: []
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPrompt ? 'Editar Prompt' : 'Crear Nuevo Prompt'}
                </DialogTitle>
                <DialogDescription>
                  {editingPrompt 
                    ? 'Modifica el prompt existente. Se creará una nueva versión.'
                    : 'Crea un nuevo prompt global que estará disponible para todos los usuarios.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Producto Tecnológico"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Prompt para videos de productos tecnológicos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Contenido del Prompt</Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Crea un video publicitario de 15-30 segundos para un producto tecnológico innovador..."
                    rows={8}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPrompt ? 'Actualizar' : 'Crear'} Prompt
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <Badge variant={prompt.is_published ? "default" : "secondary"}>
                        v{prompt.version}
                      </Badge>
                      {prompt.is_published ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Eye className="mr-1 h-3 w-3" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Borrador
                        </Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <CardDescription className="mt-1">
                        {prompt.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    
                    {prompt.is_published ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublish(prompt.id)}
                      >
                        <EyeOff className="mr-1 h-3 w-3" />
                        Despublicar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(prompt.id)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Publicar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {prompt.content}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Creado {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Última actualización {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {prompts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay prompts globales
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crea el primer prompt global para que los usuarios puedan generar videos.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
