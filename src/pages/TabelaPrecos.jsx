import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, History, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { servicoConfig } from '@/components/servicoConfig';
import { toast } from 'sonner';

export default function TabelaPrecos() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(null);
  const [novoPreco, setNovoPreco] = useState(null);

  const { data: precos = [], isLoading } = useQuery({
    queryKey: ['precos'],
    queryFn: () => base44.entities.TabelaPreco.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TabelaPreco.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precos'] });
      setNovoPreco(null);
      toast.success('Preço criado com sucesso!');
    }
  });

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, precoAnterior, motivo, tipoAlteracao }) => {
      // Atualizar o preço
      await base44.entities.TabelaPreco.update(id, data);
      
      // Registrar no histórico
      await base44.entities.HistoricoPreco.create({
        tipo_servico: precoAnterior.tipo_servico,
        valor_por_km_anterior: precoAnterior.valor_por_km,
        valor_por_km_novo: data.valor_por_km,
        valor_minimo_anterior: precoAnterior.valor_minimo,
        valor_minimo_novo: data.valor_minimo,
        motivo: motivo || 'Atualização manual',
        tipo_alteracao: tipoAlteracao || 'ajuste',
        alterado_por: authUser?.email,
        tabela_preco_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precos'] });
      queryClient.invalidateQueries({ queryKey: ['historico-precos'] });
      setEditando(null);
      toast.success('Preço atualizado e registrado no histórico!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TabelaPreco.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precos'] });
      toast.success('Preço removido!');
    }
  });

  const servicosDisponiveis = Object.keys(servicoConfig).filter(
    tipo => !precos.find(p => p.tipo_servico === tipo)
  );

  const handleSave = (data, id = null, precoAnterior = null, motivo = null, tipoAlteracao = null) => {
    if (id && precoAnterior) {
      updateMutation.mutate({ id, data, precoAnterior, motivo, tipoAlteracao });
    } else {
      createMutation.mutate(data);
    }
  };

  const PrecoForm = ({ preco, onSave, onCancel }) => {
    const [form, setForm] = useState(preco || {
      tipo_servico: servicosDisponiveis[0] || '',
      valor_por_km: '',
      valor_minimo: '',
      km_inicial_incluido: 0,
      ativo: true
    });
    const [motivo, setMotivo] = useState('');
    const [tipoAlteracao, setTipoAlteracao] = useState('ajuste');

    return (
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">
            {preco ? 'Editar Preço' : 'Novo Preço'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preco && (
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <select
                value={form.tipo_servico}
                onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              >
                {servicosDisponiveis.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {servicoConfig[tipo].title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor por KM (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_por_km}
                onChange={(e) => setForm({ ...form, valor_por_km: parseFloat(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Mínimo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_minimo}
                onChange={(e) => setForm({ ...form, valor_minimo: parseFloat(e.target.value) })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>KM Inicial Incluído</Label>
            <Input
              type="number"
              value={form.km_inicial_incluido}
              onChange={(e) => setForm({ ...form, km_inicial_incluido: parseFloat(e.target.value) })}
              className="rounded-xl"
            />
            <p className="text-xs text-slate-500">
              Quantidade de km já incluídos no valor mínimo
            </p>
          </div>

          {preco && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Alteração</Label>
                <select
                  value={tipoAlteracao}
                  onChange={(e) => setTipoAlteracao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ajuste">Ajuste de Preço</option>
                  <option value="aumento">Aumento</option>
                  <option value="reducao">Redução</option>
                  <option value="promocao">Promoção</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Motivo da Alteração</Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Promoção de Natal, Ajuste de mercado..."
                  className="rounded-xl"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <Switch
              checked={form.ativo}
              onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
            />
            <Label>Preço ativo</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onSave(form, preco?.id, preco, motivo, tipoAlteracao)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Tabela de Preços</h1>
              <p className="text-slate-500">Gerencie os preços por km de cada serviço</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('HistoricoPrecos')}>
              <Button variant="outline" className="rounded-xl">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Histórico
              </Button>
            </Link>
            {servicosDisponiveis.length > 0 && !novoPreco && (
              <Button
                onClick={() => setNovoPreco(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Preço
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid gap-4">
          {novoPreco && (
            <PrecoForm
              onSave={(data) => handleSave(data)}
              onCancel={() => setNovoPreco(null)}
            />
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-slate-100 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : precos.length === 0 && !novoPreco ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="font-semibold text-slate-800 mb-2">
                  Nenhum preço cadastrado
                </h3>
                <p className="text-slate-500 mb-6">
                  Adicione os preços por km para cada tipo de serviço
                </p>
                <Button
                  onClick={() => setNovoPreco(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Preço
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {precos.map((preco) => {
                const config = servicoConfig[preco.tipo_servico];
                const Icon = config?.icon;
                const isEditing = editando === preco.id;

                return isEditing ? (
                  <PrecoForm
                    key={preco.id}
                    preco={preco}
                    onSave={(data) => handleSave(data, preco.id)}
                    onCancel={() => setEditando(null)}
                  />
                ) : (
                  <motion.div
                    key={preco.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={`${preco.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {Icon && (
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${config.color}15` }}
                              >
                                <Icon className="w-5 h-5" style={{ color: config.color }} />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-base">{config?.title}</CardTitle>
                              <p className="text-xs text-slate-500 mt-1">
                                {preco.ativo ? 'Ativo' : 'Inativo'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditando(preco.id)}
                              className="rounded-xl h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(preco.id)}
                              className="rounded-xl h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Por KM</p>
                            <p className="text-lg font-bold text-slate-800">
                              R$ {preco.valor_por_km.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Valor Mínimo</p>
                            <p className="text-lg font-bold text-slate-800">
                              R$ {preco.valor_minimo.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {preco.km_inicial_incluido > 0 && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            Inclui {preco.km_inicial_incluido} km no valor mínimo
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}