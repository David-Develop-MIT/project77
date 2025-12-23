import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User, Star, TrendingUp, Package, DollarSign, 
  Settings, Clock, MapPin, Save, Award, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';
import ConquistasMotorista from '@/components/ConquistasMotorista';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PerfilMotorista() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-motorista-stats'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 500);
      return todos.filter(p => p.motorista_id === user?.motorista_id);
    },
    enabled: !!user?.motorista_id
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['avaliacoes-motorista', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Avaliacao.list('-created_date', 200);
      return todas.filter(a => a.avaliado_email === user?.email && a.tipo_avaliador === 'cliente');
    },
    enabled: !!user?.email
  });

  const [preferencias, setPreferencias] = useState(
    user?.preferencias_rota || {
      evitar_pedagios: false,
      evitar_vias_expressas: false,
      preferir_rotas_curtas: true
    }
  );

  const [disponibilidade, setDisponibilidade] = useState(
    user?.disponibilidade_horario || {
      segunda: { ativo: true, inicio: '08:00', fim: '18:00' },
      terca: { ativo: true, inicio: '08:00', fim: '18:00' },
      quarta: { ativo: true, inicio: '08:00', fim: '18:00' },
      quinta: { ativo: true, inicio: '08:00', fim: '18:00' },
      sexta: { ativo: true, inicio: '08:00', fim: '18:00' },
      sabado: { ativo: false, inicio: '08:00', fim: '13:00' },
      domingo: { ativo: false, inicio: '08:00', fim: '13:00' }
    }
  );

  const salvarMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Configurações salvas!');
    }
  });

  // Calcular estatísticas
  const pedidosConcluidos = pedidos.filter(p => p.status === 'concluido');
  const totalGanhos = pedidosConcluidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const mediaGanhosPorEntrega = pedidosConcluidos.length > 0 
    ? totalGanhos / pedidosConcluidos.length 
    : 0;

  // Agrupar entregas por dia para calcular máximo
  const entregasPorDia = pedidosConcluidos.reduce((acc, p) => {
    const dia = format(new Date(p.updated_date || p.created_date), 'yyyy-MM-dd');
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});
  const maxEntregasDia = Math.max(...Object.values(entregasPorDia), 0);

  const stats = {
    totalEntregas: pedidos.length,
    entregasConcluidas: pedidosConcluidos.length,
    avaliacaoMedia: user?.avaliacao_media_motorista || 0,
    totalAvaliacoes: user?.total_avaliacoes_motorista || 0,
    totalGanhos,
    mediaGanhosPorEntrega,
    maxEntregasDia,
    entregasNoPrazo: pedidosConcluidos.length // Simplificado - pode adicionar lógica de prazo
  };

  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Perfil do Motorista</h1>
            <p className="text-slate-500">Gerencie suas configurações e estatísticas</p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-slate-100 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Entregas</p>
                    <p className="text-xl font-bold text-slate-800">{stats.entregasConcluidas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-slate-100 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avaliação</p>
                    <p className="text-xl font-bold text-slate-800">
                      {stats.avaliacaoMedia.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-100 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ganhos</p>
                    <p className="text-xl font-bold text-slate-800">
                      R$ {stats.totalGanhos.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-slate-100 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Média/Entrega</p>
                    <p className="text-xl font-bold text-slate-800">
                      R$ {stats.mediaGanhosPorEntrega.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="estatisticas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-xl">
            <TabsTrigger value="estatisticas" className="rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="rounded-lg">
              <Star className="w-4 h-4 mr-2" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="conquistas" className="rounded-lg">
              <Award className="w-4 h-4 mr-2" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="rounded-lg">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Estatísticas */}
          <TabsContent value="estatisticas">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle>Desempenho Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total de Pedidos</span>
                    <span className="font-bold text-slate-800">{stats.totalEntregas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Pedidos Concluídos</span>
                    <span className="font-bold text-green-600">{stats.entregasConcluidas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Taxa de Conclusão</span>
                    <span className="font-bold text-slate-800">
                      {stats.totalEntregas > 0 
                        ? ((stats.entregasConcluidas / stats.totalEntregas) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Máx. Entregas/Dia</span>
                    <span className="font-bold text-purple-600">{stats.maxEntregasDia}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-slate-600">Total de Avaliações</span>
                    <span className="font-bold text-slate-800">{stats.totalAvaliacoes}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle>Ganhos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 mb-1">Total Acumulado</p>
                    <p className="text-3xl font-bold text-green-700">
                      R$ {stats.totalGanhos.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Média por Entrega</span>
                    <span className="font-bold text-slate-800">
                      R$ {stats.mediaGanhosPorEntrega.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Entregas este Mês</span>
                    <span className="font-bold text-slate-800">
                      {pedidosConcluidos.filter(p => {
                        const mesAtual = new Date().getMonth();
                        const mesPedido = new Date(p.updated_date || p.created_date).getMonth();
                        return mesAtual === mesPedido;
                      }).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Avaliações */}
          <TabsContent value="avaliacoes">
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Histórico de Avaliações</CardTitle>
                  <div className="text-right">
                    <AvaliacaoDisplay 
                      nota={stats.avaliacaoMedia}
                      totalAvaliacoes={stats.totalAvaliacoes}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {avaliacoes.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Nenhuma avaliação ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {avaliacoes.map((avaliacao) => (
                        <Card key={avaliacao.id} className="border-slate-100">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i <= avaliacao.nota 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-500">
                                {format(new Date(avaliacao.created_date), "dd MMM yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            {avaliacao.comentario && (
                              <p className="text-sm text-slate-600 italic">
                                "{avaliacao.comentario}"
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conquistas */}
          <TabsContent value="conquistas">
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  Suas Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConquistasMotorista 
                  stats={stats}
                  conquistasDesbloqueadas={user?.conquistas || []}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="configuracoes">
            <div className="space-y-6">
              {/* Preferências de Rota */}
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    Preferências de Rota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pedagios" className="font-medium">Evitar Pedágios</Label>
                      <p className="text-sm text-slate-500">Preferir rotas sem pedágios</p>
                    </div>
                    <Switch
                      id="pedagios"
                      checked={preferencias.evitar_pedagios}
                      onCheckedChange={(checked) => 
                        setPreferencias({...preferencias, evitar_pedagios: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="expressas" className="font-medium">Evitar Vias Expressas</Label>
                      <p className="text-sm text-slate-500">Preferir vias locais</p>
                    </div>
                    <Switch
                      id="expressas"
                      checked={preferencias.evitar_vias_expressas}
                      onCheckedChange={(checked) => 
                        setPreferencias({...preferencias, evitar_vias_expressas: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="curtas" className="font-medium">Preferir Rotas Curtas</Label>
                      <p className="text-sm text-slate-500">Otimizar por distância</p>
                    </div>
                    <Switch
                      id="curtas"
                      checked={preferencias.preferir_rotas_curtas}
                      onCheckedChange={(checked) => 
                        setPreferencias({...preferencias, preferir_rotas_curtas: checked})
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Disponibilidade de Horário */}
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Disponibilidade de Horário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {diasSemana.map((dia) => (
                      <div key={dia.key} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Switch
                              checked={disponibilidade[dia.key]?.ativo || false}
                              onCheckedChange={(checked) => 
                                setDisponibilidade({
                                  ...disponibilidade,
                                  [dia.key]: { ...disponibilidade[dia.key], ativo: checked }
                                })
                              }
                            />
                            <Label className="font-medium">{dia.label}</Label>
                          </div>
                          {disponibilidade[dia.key]?.ativo && (
                            <div className="flex gap-3 ml-10">
                              <div>
                                <Label className="text-xs text-slate-500">Início</Label>
                                <Input
                                  type="time"
                                  value={disponibilidade[dia.key]?.inicio || '08:00'}
                                  onChange={(e) => 
                                    setDisponibilidade({
                                      ...disponibilidade,
                                      [dia.key]: { ...disponibilidade[dia.key], inicio: e.target.value }
                                    })
                                  }
                                  className="rounded-lg w-28"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500">Fim</Label>
                                <Input
                                  type="time"
                                  value={disponibilidade[dia.key]?.fim || '18:00'}
                                  onChange={(e) => 
                                    setDisponibilidade({
                                      ...disponibilidade,
                                      [dia.key]: { ...disponibilidade[dia.key], fim: e.target.value }
                                    })
                                  }
                                  className="rounded-lg w-28"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={() => salvarMutation.mutate({
                    preferencias_rota: preferencias,
                    disponibilidade_horario: disponibilidade
                  })}
                  disabled={salvarMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  {salvarMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}