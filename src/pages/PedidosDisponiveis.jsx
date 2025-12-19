import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Package, MapPin, DollarSign, Clock, Navigation, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { servicoConfig } from '@/components/servicoConfig';
import { toast } from 'sonner';

export default function PedidosDisponiveis() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-disponiveis'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => p.status === 'pendente' || p.status === 'confirmado');
    },
    refetchInterval: 15000, // Atualizar automaticamente a cada 15s
    refetchOnWindowFocus: true
  });

  const aceitarMutation = useMutation({
    mutationFn: ({ pedidoId, motoristaId, motoristaNome }) => 
      base44.entities.Pedido.update(pedidoId, {
        motorista_id: motoristaId,
        motorista_nome: motoristaNome,
        status: 'em_andamento'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pedidos-disponiveis']);
      queryClient.invalidateQueries(['meus-pedidos-motorista']);
      toast.success('Pedido aceito! Boa viagem! 🚗');
    }
  });

  const handleAceitar = (pedido) => {
    if (!user?.motorista_id) {
      toast.error('Você precisa completar seu cadastro de motorista');
      return;
    }
    
    aceitarMutation.mutate({
      pedidoId: pedido.id,
      motoristaId: user.motorista_id,
      motoristaNome: user.full_name
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Pedidos Disponíveis
          </h1>
          <p className="text-slate-500">
            {pedidos.length} pedidos aguardando motorista
          </p>
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
        ) : pedidos.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Nenhum pedido disponível no momento
              </h3>
              <p className="text-slate-500">
                Novos pedidos aparecerão aqui em breve
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pedidos.map((pedido, index) => {
              const servico = servicoConfig[pedido.tipo_servico];
              const Icon = servico?.icon;

              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-100 rounded-2xl hover:shadow-lg transition-all">
                    <div 
                      className="h-2 rounded-t-2xl"
                      style={{ backgroundColor: servico?.color }}
                    />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                        {pedido.valor_total && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Ganho</p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {pedido.valor_total.toFixed(2)}
                            </p>
                          </div>
                        )}
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

                      {pedido.distancia_km && (
                        <div className="flex gap-4 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Navigation className="w-4 h-4 text-slate-400" />
                            <span>{pedido.distancia_km} km</span>
                          </div>
                          {pedido.tempo_estimado && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>{pedido.tempo_estimado}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Link to={`${createPageUrl('DetalhePedido')}?id=${pedido.id}`} className="flex-1">
                          <Button variant="outline" className="w-full rounded-xl">
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleAceitar(pedido)}
                          disabled={aceitarMutation.isPending}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}