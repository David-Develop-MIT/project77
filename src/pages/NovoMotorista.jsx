import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, User, Phone, CreditCard, FileText, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NovoMotorista() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    cnh: '',
    veiculo_tipo: 'moto',
    veiculo_placa: '',
    veiculo_modelo: '',
    status: 'disponivel'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Motorista.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['motoristas']);
      toast.success('Motorista cadastrado com sucesso!');
      navigate(createPageUrl('Motoristas'));
    },
    onError: () => {
      toast.error('Erro ao cadastrar motorista');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Motoristas')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Novo Motorista</h1>
            <p className="text-slate-500">Cadastre um novo motorista no sistema</p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Nome do motorista"
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
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="rounded-xl pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="cnh">CNH</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="cnh"
                    value={formData.cnh}
                    onChange={(e) => handleChange('cnh', e.target.value)}
                    placeholder="Número da CNH"
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="veiculo_tipo">Tipo de Veículo *</Label>
                <Select
                  value={formData.veiculo_tipo}
                  onValueChange={(value) => handleChange('veiculo_tipo', value)}
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
                    onChange={(e) => handleChange('veiculo_placa', e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    className="rounded-xl"
                    maxLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
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
                <Label htmlFor="veiculo_modelo">Modelo do Veículo</Label>
                <Input
                  id="veiculo_modelo"
                  value={formData.veiculo_modelo}
                  onChange={(e) => handleChange('veiculo_modelo', e.target.value)}
                  placeholder="Ex: Honda CG 160, Fiat Fiorino"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={createPageUrl('Motoristas')}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Motorista
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}