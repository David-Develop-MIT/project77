import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function VeiculoForm({ veiculo, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(veiculo || {
    tipo: 'carro',
    placa: '',
    modelo: '',
    cor: '',
    ano: '',
    foto_url: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.placa || !formData.modelo) {
      toast.error('Preencha placa e modelo');
      return;
    }

    onSubmit(formData);
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

            <div>
              <Label>Cor</Label>
              <Input
                value={formData.cor}
                onChange={(e) => handleChange('cor', e.target.value)}
                placeholder="Ex: Preto, Branco, Vermelho"
                className="rounded-xl"
              />
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