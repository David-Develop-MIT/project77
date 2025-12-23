import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, Car, Truck, Package, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const veiculoTipos = [
  { value: 'moto', label: 'Moto', icon: Bike },
  { value: 'carro', label: 'Carro', icon: Car },
  { value: 'van', label: 'Van', icon: Truck },
  { value: 'caminhao', label: 'Caminhão', icon: Package }
];

const modalidadesServico = [
  { value: 'motoboy', label: '🏍️ Motoboy' },
  { value: 'carreto', label: '🚗 Carreto' },
  { value: 'mudanca', label: '📦 Mudança' },
  { value: 'entulho', label: '🏗️ Entulho' },
  { value: 'comida', label: '🍔 Comida' },
  { value: 'frete', label: '🚚 Frete' }
];

export default function VeiculoForm({ veiculo, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    tipo: veiculo?.tipo || 'carro',
    modalidades: veiculo?.modalidades || [],
    nome_veiculo: veiculo?.nome_veiculo || '',
    placa: veiculo?.placa || '',
    modelo: veiculo?.modelo || '',
    cor: veiculo?.cor || '',
    ano: veiculo?.ano || '',
    nome_motorista: veiculo?.nome_motorista || '',
    tem_ajudante: veiculo?.tem_ajudante || false,
    valor_por_km: veiculo?.valor_por_km || '',
    foto_url: veiculo?.foto_url || ''
  });
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setUploadingFoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('foto_url', file_url);
      toast.success('Foto carregada!');
    } catch (error) {
      toast.error('Erro ao carregar foto');
    } finally {
      setUploadingFoto(false);
    }
  };

  const toggleModalidade = (modalidade) => {
    setFormData(prev => {
      const modalidades = prev.modalidades.includes(modalidade)
        ? prev.modalidades.filter(m => m !== modalidade)
        : [...prev.modalidades, modalidade];
      return { ...prev, modalidades };
    });
  };

  const formatarMoeda = (valor) => {
    if (!valor) return '';
    const numero = valor.toString().replace(/\D/g, '');
    const valorNumerico = parseFloat(numero) / 100;
    return valorNumerico.toFixed(2);
  };

  const handleValorKmChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    const valorFormatado = formatarMoeda(valor);
    handleChange('valor_por_km', valorFormatado);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.placa || !formData.modelo) {
      toast.error('Preencha placa e modelo');
      return;
    }

    if (!formData.nome_motorista) {
      toast.error('Preencha o nome do motorista');
      return;
    }

    if (!formData.modalidades || formData.modalidades.length === 0) {
      toast.error('Selecione pelo menos uma modalidade de serviço');
      return;
    }

    if (!formData.valor_por_km || parseFloat(formData.valor_por_km) <= 0) {
      toast.error('Informe o valor por km');
      return;
    }

    onSubmit({
      ...formData,
      valor_por_km: parseFloat(formData.valor_por_km)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="border-slate-100 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>
            {veiculo ? 'Editar Veículo' : 'Novo Veículo'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Modalidades de Serviço *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {modalidadesServico.map((modalidade) => (
                  <div
                    key={modalidade.value}
                    onClick={() => toggleModalidade(modalidade.value)}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                      formData.modalidades.includes(modalidade.value)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.modalidades.includes(modalidade.value)}
                        onCheckedChange={() => toggleModalidade(modalidade.value)}
                      />
                      <span className="text-sm font-medium">{modalidade.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Tipo de Veículo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {veiculoTipos.map(tipo => {
                    const Icon = tipo.icon;
                    return (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {tipo.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome do Veículo</Label>
              <Input
                value={formData.nome_veiculo}
                onChange={(e) => handleChange('nome_veiculo', e.target.value)}
                placeholder="Ex: Minha Moto, Fiat Strada, etc."
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Placa *</Label>
                <Input
                  value={formData.placa}
                  onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  className="rounded-xl"
                  maxLength={8}
                  required
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  value={formData.ano}
                  onChange={(e) => handleChange('ano', e.target.value)}
                  placeholder="2024"
                  className="rounded-xl"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label>Modelo e Marca *</Label>
              <Input
                value={formData.modelo}
                onChange={(e) => handleChange('modelo', e.target.value)}
                placeholder="Ex: Honda CG 160, Fiat Strada, etc."
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Cor</Label>
                <Input
                  value={formData.cor}
                  onChange={(e) => handleChange('cor', e.target.value)}
                  placeholder="Ex: Preto, Branco"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>Nome do Motorista *</Label>
                <Input
                  value={formData.nome_motorista}
                  onChange={(e) => handleChange('nome_motorista', e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Valor por Km (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <Input
                    type="text"
                    value={formData.valor_por_km}
                    onChange={handleValorKmChange}
                    placeholder="0,00"
                    className="rounded-xl pl-10"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  checked={formData.tem_ajudante}
                  onCheckedChange={(checked) => handleChange('tem_ajudante', checked)}
                />
                <Label className="cursor-pointer">Trabalha com ajudante</Label>
              </div>
            </div>

            <div>
              <Label>Foto do Veículo</Label>
              {formData.foto_url ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={formData.foto_url}
                    alt="Veículo"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => handleChange('foto_url', '')}
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">
                    {uploadingFoto ? 'Carregando...' : 'Clique para adicionar foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    disabled={uploadingFoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : veiculo ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}