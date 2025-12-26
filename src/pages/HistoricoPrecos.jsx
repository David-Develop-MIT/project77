import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Filter, 
  BarChart3, ArrowLeft, Tag, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { servicoConfig } from '@/components/servicoConfig';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function HistoricoPrecos() {
  const [servicoSelecionado, setServicoSelecionado] = useState('todos');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30'); // dias

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['historico-precos'],
    queryFn: () => base44.entities.HistoricoPreco.list('-created_date', 500)
  });

  const { data: tabelaPrecos = [] } = useQuery({
    queryKey: ['tabela-precos'],
    queryFn: () => base44.entities.TabelaPreco.list()
  });

  // Filtrar histórico por serviço e período
  const historicoFiltrado = historico.filter(h => {
    const dataRegistro = new Date(h.created_date);
    const diasAtras = parseInt(periodoSelecionado);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const dentroPerido = dataRegistro >= dataLimite;
    const servicoMatch = servicoSelecionado === 'todos' || h.tipo_servico === servicoSelecionado;

    return dentroPerido && servicoMatch;
  });

  // Calcular estatísticas
  const stats = {
    totalAlteracoes: historicoFiltrado.length,
    aumentos: historicoFiltrado.filter(h => h.tipo_alteracao === 'aumento').length,
    reducoes: historicoFiltrado.filter(h => h.tipo_alteracao === 'reducao').length,
    promocoes: historicoFiltrado.filter(h => h.tipo_alteracao === 'promocao').length,
    mediaVariacao: historicoFiltrado.reduce((acc, h) => {
      const variacaoKm = ((h.valor_por_km_novo - (h.valor_por_km_anterior || 0)) / (h.valor_por_km_anterior || 1)) * 100;
      return acc + variacaoKm;
    }, 0) / (historicoFiltrado.length || 1)
  };

  // Preparar dados para gráfico de evolução
  const dadosGrafico = React.useMemo(() => {
    const servicosFiltrados = servicoSelecionado === 'todos' 
      ? Object.keys(servicoConfig) 
      : [servicoSelecionado];

    const dados = [];
    const hoje = new Date();
    const dias = parseInt(periodoSelecionado);

    for (let i = dias; i >= 0; i -= Math.ceil(dias / 10)) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      
      const ponto = {
        data: format(data, 'dd/MM', { locale: ptBR }),
        dataCompleta: data
      };

      servicosFiltrados.forEach(servico => {
        // Pegar o último preço conhecido até essa data
        const historicosAteData = historico
          .filter(h => h.tipo_servico === servico && new Date(h.created_date) <= data)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        if (historicosAteData.length > 0) {
          ponto[servico] = historicosAteData[0].valor_por_km_novo;
        } else {
          // Usar preço atual da tabela
          const tabelaAtual = tabelaPrecos.find(t => t.tipo_servico === servico);
          ponto[servico] = tabelaAtual?.valor_por_km || 0;
        }
      });

      dados.push(ponto);
    }

    return dados;
  }, [historico, tabelaPrecos, servicoSelecionado, periodoSelecionado]);

  // Dados para gráfico de distribuição de alterações
  const dadosDistribuicao = [
    { tipo: 'Aumentos', quantidade: stats.aumentos, cor: '#ef4444' },
    { tipo: 'Reduções', quantidade: stats.reducoes, cor: '#10b981' },
    { tipo: 'Promoções', quantidade: stats.promocoes, cor: '#f59e0b' },
    { tipo: 'Ajustes', quantidade: historicoFiltrado.filter(h => h.tipo_alteracao === 'ajuste').length, cor: '#3b82f6' }
  ];

  const tipoColors = {
    aumento: 'bg-red-100 text-red-700',
    reducao: 'bg-green-100 text-green-700',
    promocao: 'bg-amber-100 text-amber-700',
    ajuste: 'bg-blue-100 text-blue-700'
  };

  const tipoIcons = {
    aumento: TrendingUp,
    reducao: TrendingDown,
    promocao: Tag,
    ajuste: Activity
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl('TabelaPrecos')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Histórico de Preços</h1>
                <p className="text-slate-500">Análise e tendências de preços</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <Card className="border-slate-100 rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Tipo de Serviço
                </label>
                <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Serviços</SelectItem>
                    {Object.entries(servicoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Período
                </label>
                <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="180">Últimos 6 meses</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-500">Total de Alterações</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stats.totalAlteracoes}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm text-slate-500">Aumentos</p>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.aumentos}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-500">Reduções</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.reducoes}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-sm text-slate-500">Promoções</p>
              </div>
              <p className="text-3xl font-bold text-amber-600">{stats.promocoes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Evolução de Preços */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Evolução de Preços (R$/km)
              </CardTitle>
              <CardDescription>
                Histórico de valores ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="data" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {servicoSelecionado === 'todos' ? (
                    Object.entries(servicoConfig).map(([key, config]) => (
                      <Line 
                        key={key}
                        type="monotone" 
                        dataKey={key} 
                        stroke={config.color}
                        name={config.title}
                        strokeWidth={2}
                      />
                    ))
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey={servicoSelecionado} 
                      stroke={servicoConfig[servicoSelecionado]?.color}
                      name={servicoConfig[servicoSelecionado]?.title}
                      strokeWidth={3}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Alterações */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Tipos de Alteração
              </CardTitle>
              <CardDescription>
                Distribuição por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosDistribuicao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="tipo" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alterações */}
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
            <CardDescription>
              {historicoFiltrado.length} alterações no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historicoFiltrado.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma alteração neste período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoFiltrado.map((item) => {
                  const servico = servicoConfig[item.tipo_servico];
                  const Icon = servico?.icon;
                  const TipoIcon = tipoIcons[item.tipo_alteracao];
                  const variacaoKm = item.valor_por_km_anterior 
                    ? ((item.valor_por_km_novo - item.valor_por_km_anterior) / item.valor_por_km_anterior * 100).toFixed(1)
                    : 0;

                  return (
                    <div 
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${servico?.color}15` }}
                        >
                          {Icon && <Icon className="w-5 h-5" style={{ color: servico?.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-800">{servico?.title}</h4>
                            <Badge className={tipoColors[item.tipo_alteracao]}>
                              <TipoIcon className="w-3 h-3 mr-1" />
                              {item.tipo_alteracao}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <p className="text-xs text-slate-500">Valor por Km</p>
                              <div className="flex items-center gap-2">
                                {item.valor_por_km_anterior && (
                                  <span className="text-sm text-slate-400 line-through">
                                    R$ {item.valor_por_km_anterior.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-slate-700">
                                  R$ {item.valor_por_km_novo.toFixed(2)}
                                </span>
                                {item.valor_por_km_anterior && (
                                  <span className={`text-xs font-medium ${parseFloat(variacaoKm) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {parseFloat(variacaoKm) > 0 ? '+' : ''}{variacaoKm}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Valor Mínimo</p>
                              <div className="flex items-center gap-2">
                                {item.valor_minimo_anterior && (
                                  <span className="text-sm text-slate-400 line-through">
                                    R$ {item.valor_minimo_anterior.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-slate-700">
                                  R$ {item.valor_minimo_novo.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {item.motivo && (
                            <p className="text-sm text-slate-600 mb-2 italic">"{item.motivo}"</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(item.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {item.alterado_por && (
                              <span>Por: {item.alterado_por.split('@')[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}