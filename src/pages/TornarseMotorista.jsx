import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Save, Loader2, Phone, FileText, Upload, X, CheckCircle } from 'lucide-react';
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
    veiculo_foto_url: '',
    modalidades: [],
    status: 'disponivel'
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);

  const aplicarMascaraTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const aplicarMascaraCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingFoto(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, veiculo_foto_url: data.file_url }));
      toast.success('Foto carregada com sucesso!');
    } catch (error) {
      toast.error('Erro ao carregar foto');
    } finally {
      setUploadingFoto(false);
    }
  };

  const toggleModalidade = (modalidade) => {
    setFormData(prev => ({
      ...prev,
      modalidades: prev.modalidades.includes(modalidade)
        ? prev.modalidades.filter(m => m !== modalidade)
        : [...prev.modalidades, modalidade]
    }));
  };

  const cadastrarMutation = useMutation({
    mutationFn: async (data) => {
      // Criar motorista
      const motorista = await base44.entities.Motorista.create(data);
      
      // Criar veículo com as modalidades
      await base44.entities.Veiculo.create({
        motorista_id: motorista.id,
        tipo: data.veiculo_tipo,
        placa: data.veiculo_placa,
        modelo: data.veiculo_modelo,
        nome_motorista: data.nome,
        foto_url: data.veiculo_foto_url,
        modalidades: data.modalidades,
        valor_por_km: 0,
        ativo: true
      });
      
      // Buscar usuário pickup
      const usuarios = await base44.entities.UsuarioPickup.list();
      const usuarioPickup = usuarios.find(u => u.email === user?.email);
      
      if (usuarioPickup) {
        // Atualizar UsuarioPickup
        const tiposAtuais = usuarioPickup.tipos_conta || [];
        await base44.entities.UsuarioPickup.update(usuarioPickup.id, {
          tipos_conta: [...new Set([...tiposAtuais, 'motorista'])],
          motorista_id: motorista.id,
          modo_ativo: 'motorista'
        });
      }
      
      return motorista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Cadastro concluído! Bem-vindo ao time de motoristas! 🚗');
      setTimeout(() => {
        navigate(createPageUrl('PedidosDisponiveis'));
      }, 1000);
    },
    onError: (error) => {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao cadastrar motorista: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone || !formData.veiculo_tipo) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (formData.modalidades.length === 0) {
      toast.error('Selecione pelo menos uma modalidade de serviço');
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
                      onChange={(e) => setFormData({...formData, telefone: aplicarMascaraTelefone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                      className="rounded-xl pl-10"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: aplicarMascaraCPF(e.target.value)})}
                    placeholder="000.000.000-00"
                    className="rounded-xl"
                    maxLength={14}
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

              <div>
                <Label>Foto do Veículo</Label>
                <div className="mt-2">
                  {formData.veiculo_foto_url ? (
                    <div className="relative">
                      <img
                        src={formData.veiculo_foto_url}
                        alt="Veículo"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full"
                        onClick={() => setFormData(prev => ({ ...prev, veiculo_foto_url: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-500 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        {uploadingFoto ? (
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-600">Clique para adicionar foto</p>
                            <p className="text-xs text-slate-400 mt-1">PNG, JPG até 5MB</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFotoUpload}
                        disabled={uploadingFoto}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Modalidades de Serviço *</Label>
                <p className="text-xs text-slate-500 mb-2">Selecione os tipos de serviço que deseja realizar</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'motoboy', label: '🏍️ Motoboy', color: 'orange' },
                    { value: 'carreto', label: '🚚 Carreto', color: 'blue' },
                    { value: 'mudanca', label: '📦 Mudança', color: 'purple' },
                    { value: 'entulho', label: '🏗️ Entulho', color: 'slate' },
                    { value: 'comida', label: '🍕 Comida', color: 'red' },
                    { value: 'frete', label: '📦 Frete', color: 'green' }
                  ].map((modalidade) => (
                    <button
                      key={modalidade.value}
                      type="button"
                      onClick={() => toggleModalidade(modalidade.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        formData.modalidades.includes(modalidade.value)
                          ? `border-${modalidade.color}-500 bg-${modalidade.color}-50 text-${modalidade.color}-700`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{modalidade.label}</span>
                        {formData.modalidades.includes(modalidade.value) && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  ))}
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