import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle, TrendingUp, Package, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/StatsCard';
import PedidoCard from '@/components/PedidoCard';
import { servicoConfig } from '@/components/servicoConfig';

export default function Home() {
  const queryClient = useQueryClient();
  
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

  const alternarModoMutation = useMutation({
    mutationFn: async (novoModo) => {
      if (!user?.id) return;
      await base44.entities.UsuarioPickup.update(user.id, { modo_ativo: novoModo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['pedidos']);
      toast.success('Modo alterado com sucesso!');
      window.location.reload();
    }
  });

  const temAmbos = user?.tipos_conta?.length > 1;

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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-800">
                {user?.modo_ativo === 'motorista' ? 'Parceiro Pickup' : 'Cliente Pickup'}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user?.modo_ativo === 'motorista' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.modo_ativo === 'motorista' ? '🚗 Motorista' : '👤 Cliente'}
              </span>
            </div>
            <p className="text-slate-500">
              Gerencie todos os seus serviços em um só lugar
            </p>
          </div>
          <div className="flex gap-2">
            {temAmbos && user && (
              <Button
                onClick={() => alternarModoMutation.mutate(user.modo_ativo === 'cliente' ? 'motorista' : 'cliente')}
                variant="outline"
                className="rounded-xl"
                disabled={alternarModoMutation.isPending || !user}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Modo {user.modo_ativo === 'cliente' ? 'Motorista' : 'Cliente'}
              </Button>
            )}
            {user?.modo_ativo === 'motorista' && (
              <Link to={createPageUrl('MeusVeiculos')}>
                <Button variant="outline" className="rounded-xl">
                  <Truck className="w-5 h-5 mr-2" />
                  Meus Veículos
                </Button>
              </Link>
            )}
          </div>
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

        {/* Quick Actions */}
        {user?.modo_ativo === 'cliente' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Serviços Disponíveis</h2>
              <Link to={createPageUrl('NovoPedido')}>
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Pedido
                </Button>
              </Link>
            </div>
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

        {/* Links Motorista */}
        {user?.modo_ativo === 'motorista' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to={createPageUrl('PedidosDisponiveis')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all text-center">
                  <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-700 text-sm">Disponíveis</p>
                </motion.div>
              </Link>
              <Link to={createPageUrl('MeusPedidosMotorista')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all text-center">
                  <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-700 text-sm">Entregas</p>
                </motion.div>
              </Link>
              <Link to={createPageUrl('MeusVeiculos')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all text-center">
                  <Truck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-700 text-sm">Veículos</p>
                </motion.div>
              </Link>
              <Link to={createPageUrl('RotasDia')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all text-center">
                  <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-700 text-sm">Rotas</p>
                </motion.div>
              </Link>
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