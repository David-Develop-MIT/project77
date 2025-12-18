import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit2, Trash2, Loader2, User, Phone, CreditCard, 
  FileText, Truck, MapPin, Save, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  ocupado: { label: 'Ocupado', color: 'bg-amber-100 text-amber-700' },
  inativo: { label: 'Inativo', color: 'bg-slate-100 text-slate-700' }
};

const veiculoLabels = {
  moto: '🏍️ Moto',
  carro: '🚗 Carro',
  van: '🚐 Van',
  caminhao: '🚚 Caminhão'
};

export default function DetalheMotorista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const motoristaId = urlParams.get('id');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const { data: motorista, isLoading } = useQuery({
    queryKey: ['motorista', motoristaId],
    queryFn: async () => {
      const motoristas = await base44.entities.Motorista.list();
      const found = motoristas.find(m => m.id === motoristaId);
      if (found) setFormData(found);
      return found;
    },
    enabled: !!motoristaId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Motorista.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['motorista', motoristaId]);
      queryClient.invalidateQueries(['motoristas']);
      toast.success('Motorista atualizado!');
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Motorista.delete(id),
    onSuccess: () => {
      toast.success('Motorista excluído!');
      navigate(createPageUrl('Motoristas'));
    }
  });

  const handleSave = () => {
    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    updateMutation.mutate({ id: motoristaId, data: formData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!motorista) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Motorista não encontrado</h2>
          <Link to={createPageUrl('Motoristas')}>
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[motorista.status] || statusConfig.disponivel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Motoristas')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Detalhes do Motorista</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir motorista?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(motoristaId)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFormData(motorista);
                    setIsEditing(false);
                  }}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Card */}
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
                  {motorista.nome?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800">{motorista.nome}</h2>
                  <Badge className={`${statusInfo.color} mt-2`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={formData?.nome || ''}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={formData?.telefone || ''}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>CPF</Label>
                      <Input
                        value={formData?.cpf || ''}
                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>CNH</Label>
                    <Input
                      value={formData?.cnh || ''}
                      onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="font-medium">{motorista.telefone}</p>
                    </div>
                  </div>
                  {motorista.cpf && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">CPF</p>
                        <p className="font-medium">{motorista.cpf}</p>
                      </div>
                    </div>
                  )}
                  {motorista.cnh && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">CNH</p>
                        <p className="font-medium">{motorista.cnh}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados do Veículo */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Tipo de Veículo *</Label>
                    <Select
                      value={formData?.veiculo_tipo || 'moto'}
                      onValueChange={(value) => setFormData({...formData, veiculo_tipo: value})}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moto">🏍️ Moto</SelectItem>
                        <SelectItem value="carro">🚗 Carro</SelectItem>
                        <SelectItem value="van">🚐 Van</SelectItem>
                        <SelectItem value="caminhao">🚚 Caminhão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Placa</Label>
                      <Input
                        value={formData?.veiculo_placa || ''}
                        onChange={(e) => setFormData({...formData, veiculo_placa: e.target.value.toUpperCase()})}
                        className="rounded-xl"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData?.status || 'disponivel'}
                        onValueChange={(value) => setFormData({...formData, status: value})}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">✅ Disponível</SelectItem>
                          <SelectItem value="ocupado">⏳ Ocupado</SelectItem>
                          <SelectItem value="inativo">❌ Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input
                      value={formData?.veiculo_modelo || ''}
                      onChange={(e) => setFormData({...formData, veiculo_modelo: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Tipo</p>
                      <p className="font-medium">{veiculoLabels[motorista.veiculo_tipo]}</p>
                    </div>
                  </div>
                  {motorista.veiculo_placa && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Placa</p>
                        <p className="font-medium">{motorista.veiculo_placa}</p>
                      </div>
                    </div>
                  )}
                  {motorista.veiculo_modelo && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Modelo</p>
                        <p className="font-medium">{motorista.veiculo_modelo}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}