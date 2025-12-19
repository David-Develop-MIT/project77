import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Clock, Navigation, DollarSign, Route, Car } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import { servicoConfig } from '@/components/servicoConfig';
import OtimizadorRotas from '@/components/OtimizadorRotas';

export default function MeusPedidosMotorista() {
  const [filtro, setFiltro] = React.useState('em_andamento');
  const [mostrarOtimizador, setMostrarOtimizador] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: veiculoAtivo } = useQuery({
    queryKey: ['veiculo-ativo', user?.veiculo_ativo_id],
    queryFn: async () => {
      if (!user?.veiculo_ativo_id) return null;
      const veiculos = await base44.entities.Veiculo.list();
      return veiculos.find(v => v.id === user.veiculo_ativo_id);
    },
    enabled: !!user?.veiculo_ativo_id
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['meus-pedidos-motorista', user?.motorista_id],
    queryFn: async () => {
      if (!user?.motorista_id) return [];
      const todos = await base44.entities.Pedido.list('-created_date', 100);
      return todos.filter(p => p.motorista_id === user.motorista_id);
    },
    enabled: !!user?.motorista_id,
    refetchInterval: 20000, // Atualizar automaticamente a cada 20s
    refetchOnWindowFocus: true
  });

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'em_andamento') return p.status === 'em_andamento' || p.status === 'confirmado' || p.status === 'em_rota';
    if (filtro === 'concluido') return p.status === 'concluido';
    return true;
  }).sort((a, b) => {
    // Ordenar por ordem_rota se estiver em rota
    if (a.status === 'em_rota' && b.status === 'em_rota') {
      return (a.ordem_rota || 0) - (b.ordem_rota || 0);
    }
    return 0;
  });

  const pedidosParaOtimizar = pedidos.filter(p => 
    p.status === 'em_andamento' || p.status === 'confirmado'
  );

  const totalGanho = pedidos
    .filter(p => p.status === 'concluido' && p.valor_total)
    .reduce((acc, p) => acc + p.valor_total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Minhas Entregas
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-slate-500">
              {pedidos.length} entregas no total
            </p>
            {veiculoAtivo && (
              <Link to={createPageUrl('MeusVeiculos')}>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer">
                  <Car className="w-3 h-3 mr-1" />
                  {veiculoAtivo.placa} - {veiculoAtivo.modelo}
                </Badge>
              </Link>
            )}
            {totalGanho > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                <p className="text-xs text-green-600">Total Ganho</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {totalGanho.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={filtro} onValueChange={setFiltro}>
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="em_andamento" className="rounded-lg">Em Andamento</TabsTrigger>
                <TabsTrigger value="concluido" className="rounded-lg">Concluídos</TabsTrigger>
                <TabsTrigger value="todos" className="rounded-lg">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {pedidosParaOtimizar.length >= 2 && filtro === 'em_andamento' && (
              <Button
                onClick={() => setMostrarOtimizador(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
              >
                <Route className="w-4 h-4 mr-2" />
                Otimizar Rota ({pedidosParaOtimizar.length})
              </Button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-slate-100 rounded-2xl animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-100 rounded w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Nenhuma entrega {filtro === 'em_andamento' ? 'em andamento' : filtro === 'concluido' ? 'concluída' : 'encontrada'}
              </h3>
              <p className="text-slate-500 mb-6">
                Aceite pedidos disponíveis para começar
              </p>
              <Link to={createPageUrl('PedidosDisponiveis')}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Ver Pedidos Disponíveis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pedidosFiltrados.map((pedido, index) => {
              const servico = servicoConfig[pedido.tipo_servico];
              const Icon = servico?.icon;

              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`${createPageUrl('DetalhePedido')}?id=${pedido.id}`}>
                    <Card className="border-slate-100 rounded-2xl hover:shadow-lg transition-all cursor-pointer">
                      <div 
                        className="h-2 rounded-t-2xl"
                        style={{ backgroundColor: servico?.color }}
                      />
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {pedido.status === 'em_rota' && pedido.ordem_rota && (
                              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {pedido.ordem_rota}
                              </div>
                            )}
                            <div 
                              className="w-11 h-11 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${servico?.color}15` }}
                            >
                              {Icon && <Icon className="w-6 h-6" style={{ color: servico?.color }} />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800">{servico?.title}</h3>
                              <p className="text-xs text-slate-500">{pedido.nome_cliente}</p>
                            </div>
                          </div>
                          <StatusBadge status={pedido.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">Origem</p>
                            <p className="text-slate-700">{pedido.endereco_origem}</p>
                          </div>
                        </div>

                        {pedido.endereco_destino && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Destino</p>
                              <p className="text-slate-700">{pedido.endereco_destino}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="flex gap-3">
                            {pedido.distancia_km && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Navigation className="w-3 h-3" />
                                {pedido.distancia_km} km
                              </div>
                            )}
                            {pedido.tempo_estimado && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Clock className="w-3 h-3" />
                                {pedido.tempo_estimado}
                              </div>
                            )}
                          </div>
                          {pedido.valor_total && (
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              R$ {pedido.valor_total.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {mostrarOtimizador && (
            <OtimizadorRotas 
              pedidos={pedidosParaOtimizar}
              onClose={() => setMostrarOtimizador(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}