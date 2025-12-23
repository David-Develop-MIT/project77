import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/StatsCard';
import PedidoCard from '@/components/PedidoCard';
import { servicoConfig } from '@/components/servicoConfig';

export default function Home() {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const usuarios = await base44.entities.UsuarioPickup.list();
      return usuarios.find(u => u.email === authUser.email);
    },
    enabled: !!authUser?.email
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 50)
  });

  const stats = {
    total: pedidos.length,
    pendentes: pedidos.filter((p) => p.status === 'pendente').length,
    emAndamento: pedidos.filter((p) => p.status === 'em_andamento' || p.status === 'confirmado').length,
    concluidos: pedidos.filter((p) => p.status === 'concluido').length
  };

  const pedidosRecentes = pedidos.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {user?.modo_ativo === 'motorista' ? 'Parceiro Pickup' : 'Cliente Pickup'}
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie todos os seus serviços em um só lugar
            </p>
          </div>
          {user?.modo_ativo === 'cliente' && (
            <Link to={createPageUrl('NovoPedido')}>
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-500/25 rounded-xl px-6">
                <Plus className="w-5 h-5 mr-2" />
                Novo Pedido
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Package}
            label="Total de Pedidos"
            value={stats.total}
            color="#3b82f6"
            delay={0} />

          <StatsCard
            icon={Clock}
            label="Pendentes"
            value={stats.pendentes}
            color="#f59e0b"
            delay={0.1} />

          <StatsCard
            icon={TrendingUp}
            label="Em Andamento"
            value={stats.emAndamento}
            color="#8b5cf6"
            delay={0.2} />

          <StatsCard
            icon={CheckCircle}
            label="Concluídos"
            value={stats.concluidos}
            color="#10b981"
            delay={0.3} />

        </div>

        {/* Quick Actions - Apenas para clientes */}
        {user?.modo_ativo === 'cliente' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">Serviços Disponíveis</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(servicoConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Link
                    key={key}
                    to={`${createPageUrl('NovoPedido')}?tipo=${key}`}>

                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all duration-300 cursor-pointer text-center">

                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: `${config.color}15` }}>

                        <Icon className="w-6 h-6" style={{ color: config.color }} />
                      </div>
                      <p className="font-medium text-slate-700 text-sm">{config.title}</p>
                    </motion.div>
                  </Link>);

              })}
            </div>
          </motion.div>
        )}

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Pedidos Recentes</h2>
            <Link to={createPageUrl('MeusPedidos')}>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-800">
                Ver todos
              </Button>
            </Link>
          </div>
          
          {isLoading ?
          <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) =>
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                </div>
            )}
            </div> :
          pedidosRecentes.length === 0 ?
          <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Nenhum pedido ainda</h3>
              <p className="text-slate-500 mb-6">Crie seu primeiro pedido para começar</p>
              <Link to={createPageUrl('NovoPedido')}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Pedido
                </Button>
              </Link>
            </div> :

          <div className="grid gap-4 md:grid-cols-2">
              {pedidosRecentes.map((pedido) =>
            <Link key={pedido.id} to={`${createPageUrl('DetalhePedido')}?id=${pedido.id}`}>
                  <PedidoCard pedido={pedido} />
                </Link>
            )}
            </div>
          }
        </motion.div>
      </div>
    </div>);

}