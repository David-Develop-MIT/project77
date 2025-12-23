import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Star, Package, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';

export default function PerfilCliente() {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: ''
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ['meus-pedidos-cliente'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 50),
    select: (data) => data.filter(p => p.created_by === user?.email)
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        telefone: user.telefone || '',
        cep: user.cep || '',
        endereco: user.endereco || '',
        numero: user.numero || '',
        complemento: user.complemento || ''
      });
    }
  }, [user]);

  const atualizarMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Perfil atualizado!');
      setEditando(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    atualizarMutation.mutate(formData);
  };

  const stats = {
    total: pedidos.length,
    concluidos: pedidos.filter(p => p.status === 'concluido').length,
    emAndamento: pedidos.filter(p => ['pendente', 'confirmado', 'em_andamento'].includes(p.status)).length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Meu Perfil</h1>
          <p className="text-slate-500">Gerencie suas informações pessoais</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações Principais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Informações Pessoais</CardTitle>
                {!editando ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditando(true)}
                    className="rounded-xl"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditando(false);
                        setFormData({
                          full_name: user.full_name || '',
                          telefone: user.telefone || '',
                          cep: user.cep || '',
                          endereco: user.endereco || '',
                          numero: user.numero || '',
                          complemento: user.complemento || ''
                        });
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={atualizarMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nome Completo
                      </label>
                      {editando ? (
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2">{user?.full_name || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-slate-800 font-medium p-2">{user?.email}</p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </label>
                      {editando ? (
                        <Input
                          value={formData.telefone}
                          onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2">{user?.telefone || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        CEP
                      </label>
                      {editando ? (
                        <Input
                          value={formData.cep}
                          onChange={(e) => setFormData({...formData, cep: e.target.value})}
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2">{user?.cep || '-'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço
                    </label>
                    {editando ? (
                      <Input
                        value={formData.endereco}
                        onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium p-2">{user?.endereco || '-'}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600 mb-2">Número</label>
                      {editando ? (
                        <Input
                          value={formData.numero}
                          onChange={(e) => setFormData({...formData, numero: e.target.value})}
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2">{user?.numero || '-'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-slate-600 mb-2">Complemento</label>
                      {editando ? (
                        <Input
                          value={formData.complemento}
                          onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2">{user?.complemento || '-'}</p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Total de Pedidos</span>
                  <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Concluídos</span>
                  <span className="text-xl font-semibold text-green-600">{stats.concluidos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Em Andamento</span>
                  <span className="text-xl font-semibold text-blue-600">{stats.emAndamento}</span>
                </div>
              </CardContent>
            </Card>

            {user?.avaliacao_media_cliente && (
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AvaliacaoDisplay
                    nota={user.avaliacao_media_cliente}
                    totalAvaliacoes={user.total_avaliacoes_cliente || 0}
                    size="md"
                  />
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}