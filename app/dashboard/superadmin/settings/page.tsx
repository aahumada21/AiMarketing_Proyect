"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Loader2, CreditCard, Clock, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GlobalSetting } from "@/lib/types";

export default function SuperadminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      await loadSettings();
      setLoading(false);
    }

    loadData();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('global_settings')
      .select('*');
    
    if (!error && data) {
      const settingsMap: Record<string, any> = {};
      data.forEach(setting => {
        // Extract the actual value from the JSONB structure
        if (setting.value && typeof setting.value === 'object') {
          // For nested objects like { credits_per_video: 10 }
          const keys = Object.keys(setting.value);
          if (keys.length === 1 && keys[0] === setting.key) {
            settingsMap[setting.key] = setting.value[keys[0]];
          } else {
            settingsMap[setting.key] = setting.value;
          }
        } else {
          settingsMap[setting.key] = setting.value;
        }
      });
      
      // Ensure supported_aspect_ratios is always an array
      if (settingsMap.supported_aspect_ratios && !Array.isArray(settingsMap.supported_aspect_ratios)) {
        settingsMap.supported_aspect_ratios = ['9:16', '1:1', '16:9'];
      }
      
      console.log('Loaded settings:', settingsMap);
      setSettings(settingsMap);
    }
  };

  const handleSave = async () => {
    // No need to check user context for settings save
    
    setSaving(true);
    const supabase = createClient();
    
    try {
      console.log('Saving settings:', settings);
      
      // Update credits per video
      await supabase
        .from('global_settings')
        .upsert({
          key: 'credits_per_video',
          value: parseInt(settings.credits_per_video || '10'),
          updated_at: new Date().toISOString()
        });

      // Update max duration
      await supabase
        .from('global_settings')
        .upsert({
          key: 'max_duration_sec',
          value: parseInt(settings.max_duration_sec || '30'),
          updated_at: new Date().toISOString()
        });

      // Update supported aspect ratios
      await supabase
        .from('global_settings')
        .upsert({
          key: 'supported_aspect_ratios',
          value: settings.supported_aspect_ratios || ['9:16', '1:1', '16:9'],
          updated_at: new Date().toISOString()
        });

      alert('Configuración guardada exitosamente');
      // Reload settings to reflect changes in the UI
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración Global
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configura los parámetros globales del sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Credits Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Configuración de Créditos</span>
              </CardTitle>
              <CardDescription>
                Configura el costo de generación de videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="credits_per_video">Créditos por Video</Label>
                <Input
                  id="credits_per_video"
                  type="number"
                  min="1"
                  value={settings.credits_per_video || 10}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    credits_per_video: parseInt(e.target.value)
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Número de créditos que se descuentan por cada video generado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Configuración de Videos</span>
              </CardTitle>
              <CardDescription>
                Configura los límites y opciones de generación de videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="max_duration_sec">Duración Máxima (segundos)</Label>
                <Input
                  id="max_duration_sec"
                  type="number"
                  min="5"
                  max="60"
                  value={settings.max_duration_sec || 30}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    max_duration_sec: parseInt(e.target.value)
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Duración máxima permitida para videos generados
                </p>
              </div>
              
              <div>
                <Label htmlFor="supported_aspect_ratios">Aspectos Soportados</Label>
                <div className="mt-1 space-y-2">
                  {['9:16', '1:1', '16:9'].map((ratio) => (
                    <div key={ratio} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`ratio_${ratio}`}
                        checked={Array.isArray(settings.supported_aspect_ratios) ? settings.supported_aspect_ratios.includes(ratio) : ['9:16', '1:1', '16:9'].includes(ratio)}
                        onChange={(e) => {
                          const currentRatios = Array.isArray(settings.supported_aspect_ratios) ? settings.supported_aspect_ratios : ['9:16', '1:1', '16:9'];
                          const newRatios = e.target.checked
                            ? [...currentRatios, ratio]
                            : currentRatios.filter(r => r !== ratio);
                          
                          setSettings(prev => ({
                            ...prev,
                            supported_aspect_ratios: newRatios
                          }));
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`ratio_${ratio}`} className="text-sm">
                        {ratio} {ratio === '9:16' ? '(Vertical)' : ratio === '1:1' ? '(Cuadrado)' : '(Horizontal)'}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aspectos de video disponibles para los usuarios
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Información del Sistema</span>
              </CardTitle>
              <CardDescription>
                Información sobre el estado actual del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {settings.credits_per_video || 10}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Créditos por Video
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {settings.max_duration_sec || 30}s
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Duración Máxima
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Array.isArray(settings.supported_aspect_ratios) ? settings.supported_aspect_ratios.length : 3}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    Aspectos Soportados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
