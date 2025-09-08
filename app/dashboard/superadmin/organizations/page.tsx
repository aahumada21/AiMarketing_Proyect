"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  CreditCard, 
  Calendar,
  Search,
  Filter,
  Loader2,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { getAllOrganizations, createOrganization, updateOrganization, deleteOrganization } from "@/lib/superadmin-client";
import { getOrganizationMembers, addOrganizationMember, updateMemberRole, removeOrganizationMember } from "@/lib/organization-members-client";
import type { Organization, OrgPlan, OrgStatus } from "@/lib/types";
import type { OrganizationMember } from "@/lib/organization-members-client";

interface CreateOrganizationForm {
  name: string;
  description: string;
  plan: OrgPlan;
  status: OrgStatus;
}

interface OrganizationWithDetails extends Organization {
  members_count: number;
  projects_count: number;
  current_credits: number;
}

export default function SuperadminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<OrganizationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [superadminOrgId, setSuperadminOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [form, setForm] = useState<CreateOrganizationForm>({
    name: '',
    description: '',
    plan: 'free',
    status: 'active'
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const result = await getAllOrganizations();
      
      if (result.success) {
        setOrganizations(result.data || []);
        
        // Find the superadmin organization (assuming it's the one with superadmin members)
        // For now, we'll use a simple approach - the first organization with superadmin role
        // In a real implementation, you'd get this from the API
        const superadminOrg = result.data?.find(org => 
          org.name === 'Superadmin Organization' || 
          org.id === '00000000-0000-0000-0000-000000000000'
        );
        
        if (superadminOrg) {
          setSuperadminOrgId(superadminOrg.id);
        }
      } else {
        console.error('Error loading organizations:', result.error);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (editingOrganization) {
        // Update existing organization
        result = await updateOrganization(editingOrganization.id, form);
      } else {
        // Create new organization
        result = await createOrganization(form);
      }

      if (result.success) {
        // Reset form and reload data
        setForm({
          name: '',
          description: '',
          plan: 'free',
          status: 'active'
        });
        setDialogOpen(false);
        setEditingOrganization(null);
        await loadOrganizations();
      } else {
        console.error('Error saving organization:', result.error);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
    }
  };

  const handleEdit = async (organization: OrganizationWithDetails) => {
    setEditingOrganization(organization);
    setForm({
      name: organization.name,
      description: organization.description || '',
      plan: organization.plan,
      status: organization.status
    });
    setDialogOpen(true);
    
    // Load members for this organization
    await loadMembers(organization.id);
  };

  const loadMembers = async (organizationId: string) => {
    setMembersLoading(true);
    try {
      const result = await getOrganizationMembers(organizationId);
      if (result.success) {
        setMembers(result.data || []);
        setShowMembers(true);
      } else {
        console.error('Error loading members:', result.error);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!editingOrganization) return;
    
    try {
      const result = await updateMemberRole(editingOrganization.id, userId, newRole);
      if (result.success) {
        await loadMembers(editingOrganization.id);
      } else {
        console.error('Error updating member role:', result.error);
        alert('Error al actualizar el rol del miembro');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Error al actualizar el rol del miembro');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!editingOrganization) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este miembro de la organización?')) {
      return;
    }
    
    try {
      const result = await removeOrganizationMember(editingOrganization.id, userId);
      if (result.success) {
        await loadMembers(editingOrganization.id);
      } else {
        console.error('Error removing member:', result.error);
        alert('Error al eliminar el miembro');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error al eliminar el miembro');
    }
  };

  const handleDelete = async (organization: OrganizationWithDetails) => {
    // Prevent deletion of superadmin organization
    if (organization.id === superadminOrgId) {
      alert('No puedes eliminar la organización del superadmin');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la organización "${organization.name}"?`)) {
      return;
    }

    try {
      const result = await deleteOrganization(organization.id);
      
      if (result.success) {
        await loadOrganizations();
      } else {
        console.error('Error deleting organization:', result.error);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Activa' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspendida' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactiva' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      free: { color: 'bg-blue-100 text-blue-800', label: 'Gratuito' },
      pro: { color: 'bg-purple-100 text-purple-800', label: 'Pro' },
      enterprise: { color: 'bg-orange-100 text-orange-800', label: 'Enterprise' }
    };
    
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.free;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Organizaciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Administra todas las organizaciones de la plataforma
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingOrganization(null);
                setForm({
                  name: '',
                  description: '',
                  plan: 'free',
                  status: 'active'
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Organización
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrganization ? 'Editar Organización' : 'Nueva Organización'}
                </DialogTitle>
                <DialogDescription>
                  {editingOrganization 
                    ? 'Modifica los datos de la organización.' 
                    : 'Crea una nueva organización en la plataforma.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <Select value={form.plan} onValueChange={(value: 'free' | 'pro' | 'enterprise') => 
                    setForm(prev => ({ ...prev, plan: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={form.status} onValueChange={(value: 'active' | 'suspended' | 'inactive') => 
                    setForm(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="suspended">Suspendida</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Members Section - Only show when editing */}
                {editingOrganization && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Miembros de la Organización</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMembers(!showMembers)}
                      >
                        {showMembers ? 'Ocultar' : 'Mostrar'} Miembros
                      </Button>
                    </div>
                    
                    {showMembers && (
                      <div className="space-y-4">
                        {membersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Cargando miembros...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {members.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>No hay miembros en esta organización</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {members.map((member) => (
                                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {member.profiles.full_name || 'Usuario sin nombre'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          ID: {member.user_id}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Select
                                        value={member.role}
                                        onValueChange={(value: 'admin' | 'member') => 
                                          handleUpdateMemberRole(member.user_id, value)
                                        }
                                        disabled={member.role === 'superadmin'}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="member">Miembro</SelectItem>
                                          {member.role === 'superadmin' && (
                                            <SelectItem value="superadmin" disabled>
                                              Superadmin
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveMember(member.user_id)}
                                        disabled={member.role === 'superadmin'}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    setShowMembers(false);
                    setMembers([]);
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingOrganization ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar organizaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="suspended">Suspendidas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miembros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyectos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créditos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* Info column - no header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((organization) => (
                  <tr key={organization.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {organization.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {organization.description || 'Sin descripción'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPlanBadge(organization.plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(organization.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {organization.members_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {organization.projects_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {organization.current_credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(organization)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(organization)}
                          className="text-red-600 hover:text-red-700"
                          disabled={organization.id === superadminOrgId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {organization.id === superadminOrgId && (
                        <div 
                          className="flex items-center justify-center"
                          title="No puedes eliminar la organización del superadmin"
                        >
                          <Info className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrganizations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron organizaciones' : 'No hay organizaciones'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda.'
                  : 'Crea la primera organización para comenzar.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Organización
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
