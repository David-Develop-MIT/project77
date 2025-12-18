import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Save, Loader2, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TornarseMotorista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    nome: user?.full_name || '',
    telefone: '',
    cpf: '',
    cnh: '',
    veiculo_tipo: 'moto',
    veiculo_placa: '',
    veiculo_modelo: '',
    status: 'disponivel'
  });

  const cadastrarMutation = useMutation({
    mutationFn: async (data) => {
      // Criar motorista
      const motorista = await base44.entities.Motorista.create(data);
      
      // Atualizar user
      const tiposAtuais = user.tipos_conta || [];
      await base44.auth.updateMe({
        tipos_conta: [...new Set([...tiposAtuais, 'motorista'])],
        motorista_id: motorista.id,
        modo_ativo: 'motorista'
      });
      
      return motorista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Cadastro concluído! Bem-vindo ao time de motoristas! 🚗');
      navigate(createPageUrl('PedidosDisponiveis'));
    },
    onError: () => {
      toast.error('Erro ao cadastrar motorista');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone || !formData.veiculo_tipo) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    cadastrarMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tornar-se Motorista</h1>
            <p className="text-slate-500">Complete seu cadastro para começar a fazer entregas</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-orange-200 rounded-2xl bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Ganhe dinheiro fazendo entregas</h3>
                  <p className="text-sm text-slate-600">
                    Defina seus próprios horários e aceite apenas os pedidos que desejar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Seu nome completo"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="rounded-xl pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cnh">CNH</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="cnh"
                    value={formData.cnh}
                    onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                    placeholder="Número da CNH"
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle>Dados do Veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="veiculo_tipo">Tipo de Veículo *</Label>
                <Select
                  value={formData.veiculo_tipo}
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
                  <Label htmlFor="veiculo_placa">Placa</Label>
                  <Input
                    id="veiculo_placa"
                    value={formData.veiculo_placa}
                    onChange={(e) => setFormData({...formData, veiculo_placa: e.target.value.toUpperCase()})}
                    placeholder="ABC-1234"
                    className="rounded-xl"
                    maxLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="veiculo_modelo">Modelo</Label>
                  <Input
                    id="veiculo_modelo"
                    value={formData.veiculo_modelo}
                    onChange={(e) => setFormData({...formData, veiculo_modelo: e.target.value})}
                    placeholder="Ex: Honda CG 160"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={createPageUrl('Home')}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              disabled={cadastrarMutation.isPending}
            >
              {cadastrarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Começar a Fazer Entregas
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}