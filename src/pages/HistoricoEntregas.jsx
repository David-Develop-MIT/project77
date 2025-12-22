import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Package, DollarSign, Star, TrendingUp, Calendar, 
  Search, Filter, MapPin, User, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { servicoConfig } from '@/components/servicoConfig';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';
import StatusBadge from '@/components/StatusBadge';

export default function HistoricoEntregas() {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('-created_date');
  const [filtroStatus, setFiltroStatus] = useState('concluido');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['historico-entregas', user?.motorista_id],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 500);
      return todos.filter(p => p.motorista_id === user?.motorista_id);
    },
    enabled: !!user?.motorista_id
  });

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['avaliacoes-motorista', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Avaliacao.list();
      return todas.filter(a => a.avaliado_email === user?.email && a.tipo_avaliador === 'cliente');
    },
    enabled: !!user?.email
  });

  // Filtrar e ordenar pedidos
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    // Filtro por status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(p => p.status === filtroStatus);
    }

    // Busca por cliente ou endereços
    if (busca) {
      resultado = resultado.filter(p => 
        p.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
        p.endereco_origem?.toLowerCase().includes(busca.toLowerCase()) ||
        p.endereco_destino?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Ordenação
    resultado.sort((a, b) => {
      if (ordenacao === '-created_date') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (ordenacao === 'created_date') {
        return new Date(a.created_date) - new Date(b.created_date);
      } else if (ordenacao === 'nome_cliente') {
        return (a.nome_cliente || '').localeCompare(b.nome_cliente || '');
      } else if (ordenacao === '-valor_total') {
        return (b.valor_total || 0) - (a.valor_total || 0);
      }
      return 0;
    });

    return resultado;
  }, [pedidos, busca, ordenacao, filtroStatus]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const concluidos = pedidos.filter(p => p.status === 'concluido');
    const mesAtual = new Date();
    const inicioMes = startOfMonth(mesAtual);
    const fimMes = endOfMonth(mesAtual);

    const pedidosMes = concluidos.filter(p => {
      const data = new Date(p.created_date);
      return isWithinInterval(data, { start: inicioMes, end: fimMes });
    });

    const totalGanhoGeral = concluidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
    const totalGanhoMes = pedidosMes.reduce((acc, p) => acc + (p.valor_total || 0), 0);

    const mediaAvaliacoes = avaliacoes.length > 0
      ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length
      : 0;

    return {
      totalEntregas: concluidos.length,
      totalEntregasMes: pedidosMes.length,
      totalGanhoGeral,
      totalGanhoMes,
      mediaAvaliacoes,
      totalAvaliacoes: avaliacoes.length
    };
  }, [pedidos, avaliacoes]);

  // Mapear avaliações por pedido
  const avaliacoesPorPedido = useMemo(() => {
    const mapa = {};
    avaliacoes.forEach(av => {
      mapa[av.pedido_id] = av;
    });
    return mapa;
  }, [avaliacoes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Histórico de Entregas
          </h1>
          <p className="text-slate-500">
            Acompanhe suas estatísticas e histórico completo
          </p>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="border-slate-100 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Package className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">{estatisticas.totalEntregas}</p>
                    <p className="text-xs text-blue-100">Total de Entregas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-slate-100 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ {estatisticas.totalGanhoGeral.toFixed(0)}</p>
                    <p className="text-xs text-green-100">Ganho Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-100 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ {estatisticas.totalGanhoMes.toFixed(0)}</p>
                    <p className="text-xs text-purple-100">Ganho este Mês</p>
                  </div>
                </div>
                <p className="text-xs text-purple-100 mt-1">
                  {estatisticas.totalEntregasMes} entregas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-slate-100 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Star className="w-8 h-8 opacity-80 fill-white" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {estatisticas.mediaAvaliacoes > 0 ? estatisticas.mediaAvaliacoes.toFixed(1) : '-'}
                    </p>
                    <p className="text-xs text-yellow-100">Média de Avaliações</p>
                  </div>
                </div>
                <p className="text-xs text-yellow-100 mt-1">
                  {estatisticas.totalAvaliacoes} avaliações
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtros e Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por cliente ou endereço..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                <Select value={ordenacao} onValueChange={setOrdenacao}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_date">Mais recentes</SelectItem>
                    <SelectItem value="created_date">Mais antigas</SelectItem>
                    <SelectItem value="nome_cliente">Nome do cliente</SelectItem>
                    <SelectItem value="-valor_total">Maior valor</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="concluido">Concluídos</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Nenhuma entrega encontrada
              </h3>
              <p className="text-slate-500">
                {busca ? 'Tente ajustar os filtros de busca' : 'Suas entregas aparecerão aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido, index) => {
              const servico = servicoConfig[pedido.tipo_servico];
              const Icon = servico?.icon;
              const avaliacao = avaliacoesPorPedido[pedido.id];

              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link to={`${createPageUrl('DetalhePedido')}?id=${pedido.id}`}>
                    <Card className="border-slate-100 rounded-2xl hover:shadow-lg transition-all cursor-pointer">
                      <div 
                        className="h-2 rounded-t-2xl"
                        style={{ backgroundColor: servico?.color }}
                      />
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Ícone e Info Principal */}
                          <div className="flex items-start gap-4 flex-1">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${servico?.color}15` }}
                            >
                              {Icon && <Icon className="w-6 h-6" style={{ color: servico?.color }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-slate-800">{servico?.title}</h3>
                                <StatusBadge status={pedido.status} />
                                <span className="text-xs text-slate-500">
                                  {format(new Date(pedido.created_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <span>{pedido.nome_cliente}</span>
                              </div>

                              <div className="grid md:grid-cols-2 gap-2 mt-2">
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-600 line-clamp-1">{pedido.endereco_origem}</span>
                                </div>
                                {pedido.endereco_destino && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-600 line-clamp-1">{pedido.endereco_destino}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Valor e Avaliação */}
                          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                            {pedido.valor_total && (
                              <div className="text-center md:text-right">
                                <p className="text-xs text-slate-500 mb-1">Ganho</p>
                                <p className="text-xl font-bold text-green-600">
                                  R$ {pedido.valor_total.toFixed(2)}
                                </p>
                              </div>
                            )}
                            
                            {avaliacao && (
                              <div className="text-center md:text-right">
                                <p className="text-xs text-slate-500 mb-1">Avaliação</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold text-slate-800">{avaliacao.nota.toFixed(1)}</span>
                                </div>
                                {avaliacao.comentario && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[150px]">
                                    "{avaliacao.comentario}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Resumo no rodapé */}
        {pedidosFiltrados.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-slate-500"
          >
            Mostrando {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'entrega' : 'entregas'}
          </motion.div>
        )}
      </div>
    </div>
  );
}