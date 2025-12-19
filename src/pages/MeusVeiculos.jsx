import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Car, Bike, Truck, Package, Edit2, Trash2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import VeiculoForm from '@/components/VeiculoForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const veiculoIcons = {
  moto: Bike,
  carro: Car,
  van: Truck,
  caminhao: Package
};

const veiculoLabels = {
  moto: 'Moto',
  carro: 'Carro',
  van: 'Van',
  caminhao: 'Caminhão'
};

export default function MeusVeiculos() {
  const [showForm, setShowForm] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: veiculos = [], isLoading } = useQuery({
    queryKey: ['meus-veiculos'],
    queryFn: async () => {
      const todos = await base44.entities.Veiculo.list('-created_date', 100);
      return todos.filter(v => v.motorista_id === user?.motorista_id);
    },
    enabled: !!user?.motorista_id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Veiculo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['meus-veiculos']);
      setShowForm(false);
      setEditingVeiculo(null);
      toast.success('Veículo cadastrado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Veiculo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['meus-veiculos']);
      setShowForm(false);
      setEditingVeiculo(null);
      toast.success('Veículo atualizado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Veiculo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['meus-veiculos']);
      setDeletingId(null);
      toast.success('Veículo removido!');
    }
  });

  const setVeiculoAtivoMutation = useMutation({
    mutationFn: (veiculoId) => base44.auth.updateMe({ veiculo_ativo_id: veiculoId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Veículo ativo atualizado!');
    }
  });

  const handleSubmit = (data) => {
    const veiculoData = {
      ...data,
      motorista_id: user.motorista_id
    };

    if (editingVeiculo) {
      updateMutation.mutate({ id: editingVeiculo.id, data: veiculoData });
    } else {
      createMutation.mutate(veiculoData);
    }
  };

  const handleEdit = (veiculo) => {
    setEditingVeiculo(veiculo);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingVeiculo(null);
    setShowForm(true);
  };

  const handleSetAtivo = (veiculoId) => {
    setVeiculoAtivoMutation.mutate(veiculoId);
  };

  if (!user?.motorista_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="max-w-md border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">
              Perfil de motorista necessário
            </h3>
            <p className="text-slate-500">
              Complete seu cadastro de motorista para gerenciar veículos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Meus Veículos</h1>
            <p className="text-slate-500 mt-1">
              {veiculos.length} {veiculos.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}
            </p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Veículo
          </Button>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <VeiculoForm
                veiculo={editingVeiculo}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingVeiculo(null);
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-slate-100 rounded-2xl animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-100 rounded w-32" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-slate-100 rounded mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : veiculos.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Nenhum veículo cadastrado
              </h3>
              <p className="text-slate-500 mb-6">
                Adicione seu primeiro veículo para começar
              </p>
              <Button
                onClick={handleNew}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {veiculos.map((veiculo, index) => {
              const Icon = veiculoIcons[veiculo.tipo];
              const isAtivo = user.veiculo_ativo_id === veiculo.id;

              return (
                <motion.div
                  key={veiculo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-slate-100 rounded-2xl hover:shadow-lg transition-all ${isAtivo ? 'ring-2 ring-orange-500' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{veiculoLabels[veiculo.tipo]}</h3>
                            <p className="text-xs text-slate-500">{veiculo.placa}</p>
                          </div>
                        </div>
                        {isAtivo && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {veiculo.foto_url && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={veiculo.foto_url}
                            alt={veiculo.modelo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-500">Modelo</p>
                          <p className="text-sm font-medium text-slate-700">{veiculo.modelo}</p>
                        </div>
                        {veiculo.cor && (
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Cor</p>
                              <p className="text-sm text-slate-700">{veiculo.cor}</p>
                            </div>
                            {veiculo.ano && (
                              <div>
                                <p className="text-xs text-slate-500">Ano</p>
                                <p className="text-sm text-slate-700">{veiculo.ano}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {!isAtivo && (
                          <Button
                            onClick={() => handleSetAtivo(veiculo.id)}
                            disabled={setVeiculoAtivoMutation.isPending}
                            variant="outline"
                            className="flex-1 rounded-xl text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Usar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEdit(veiculo)}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeletingId(veiculo.id)}
                          variant="outline"
                          className="rounded-xl text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover veículo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O veículo será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deletingId)}
                className="bg-red-500 hover:bg-red-600"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}