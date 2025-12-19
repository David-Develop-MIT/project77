import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Search, Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PedidoCard from '@/components/PedidoCard';

export default function MeusPedidos() {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 100),
    refetchInterval: 20000, // Atualizar automaticamente a cada 20s
    refetchOnWindowFocus: true
  });

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchStatus = filtroStatus === 'todos' || pedido.status === filtroStatus;
    const matchBusca = !busca || 
      pedido.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.endereco_origem?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.endereco_destino?.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Meus Pedidos</h1>
              <p className="text-slate-500">{pedidos.length} pedidos no total</p>
            </div>
          </div>
          <Link to={createPageUrl('NovoPedido')}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Novo Pedido
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 rounded-xl border-slate-200"
              />
            </div>
            <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
              <TabsList className="bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="todos" className="rounded-lg">Todos</TabsTrigger>
                <TabsTrigger value="pendente" className="rounded-lg">Pendentes</TabsTrigger>
                <TabsTrigger value="em_andamento" className="rounded-lg">Em Andamento</TabsTrigger>
                <TabsTrigger value="concluido" className="rounded-lg">Concluídos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Orders List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
            ))}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 border border-slate-100 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">
              {busca || filtroStatus !== 'todos' ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
            </h3>
            <p className="text-slate-500 mb-6">
              {busca || filtroStatus !== 'todos' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Crie seu primeiro pedido para começar'}
            </p>
            {!busca && filtroStatus === 'todos' && (
              <Link to={createPageUrl('NovoPedido')}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Pedido
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {pedidosFiltrados.map((pedido, index) => (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`${createPageUrl('DetalhePedido')}?id=${pedido.id}`}>
                  <PedidoCard pedido={pedido} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}