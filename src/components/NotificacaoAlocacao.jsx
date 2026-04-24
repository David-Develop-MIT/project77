import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, MapPin, Clock, DollarSign, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { servicoConfig } from '@/components/servicoConfig';

export default function NotificacaoAlocacao() {
  const [pedidoSugerido, setPedidoSugerido] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Buscar pedidos sugeridos
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-sugeridos', user?.motorista_id],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => 
        p.motorista_sugerido_id === user?.motorista_id && 
        p.status_alocacao === 'sugerido'
      );
    },
    enabled: !!user?.motorista_id,
    refetchInterval: 60000
  });

  // Atualizar pedido sugerido
  useEffect(() => {
    if (pedidos.length > 0 && !pedidoSugerido) {
      setPedidoSugerido(pedidos[0]);
      toast.info('🎯 Novo pedido disponível para você!', {
        duration: 5000
      });
    }
  }, [pedidos]);

  const aceitarRecusarMutation = useMutation({
    mutationFn: async ({ pedido_id, aceitar }) => {
      const response = await base44.functions.invoke('aceitarRecusarPedido', {
        pedido_id,
        aceitar
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['pedidos-sugeridos']);
      queryClient.invalidateQueries(['pedidos']);
      queryClient.invalidateQueries(['meus-pedidos-motorista']);
      setPedidoSugerido(null);
      
      if (variables.aceitar) {
        toast.success('Pedido aceito! Boa viagem! 🚗');
      } else {
        toast.info('Pedido recusado');
      }
    }
  });

  if (!pedidoSugerido) return null;

  const servico = servicoConfig[pedidoSugerido.tipo_servico];
  const Icon = servico?.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50"
      >
        <Card className="border-2 border-blue-500 rounded-2xl shadow-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-500 text-white">
                🎯 Pedido Sugerido para Você!
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${servico?.color}15` }}
                >
                  {Icon && <Icon className="w-6 h-6" style={{ color: servico?.color }} />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{servico?.title}</h3>
                  <p className="text-xs text-slate-500">{pedidoSugerido.nome_cliente}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="truncate">{pedidoSugerido.endereco_origem}</span>
                </div>
                {pedidoSugerido.endereco_destino && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="truncate">{pedidoSugerido.endereco_destino}</span>
                  </div>
                )}
                {pedidoSugerido.distancia_km && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Navigation className="w-4 h-4" />
                    <span>{pedidoSugerido.distancia_km} km</span>
                    {pedidoSugerido.tempo_estimado && (
                      <>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{pedidoSugerido.tempo_estimado}</span>
                      </>
                    )}
                  </div>
                )}
                {pedidoSugerido.valor_total && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>R$ {pedidoSugerido.valor_total.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => aceitarRecusarMutation.mutate({
                    pedido_id: pedidoSugerido.id,
                    aceitar: false
                  })}
                  disabled={aceitarRecusarMutation.isPending}
                  className="flex-1 rounded-xl"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
                <Button
                  onClick={() => aceitarRecusarMutation.mutate({
                    pedido_id: pedidoSugerido.id,
                    aceitar: true
                  })}
                  disabled={aceitarRecusarMutation.isPending}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}