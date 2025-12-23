import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { DollarSign, Clock, MessageSquare, User, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';
import { toast } from 'sonner';

export default function OfertasPedido({ pedidoId, pedido }) {
  const queryClient = useQueryClient();

  const { data: ofertas = [], isLoading } = useQuery({
    queryKey: ['ofertas-pedido', pedidoId],
    queryFn: async () => {
      const todasOfertas = await base44.entities.Oferta.list('-created_date', 100);
      return todasOfertas.filter(o => o.pedido_id === pedidoId);
    },
    enabled: !!pedidoId,
    refetchInterval: 15000
  });

  const { data: motoristas = [] } = useQuery({
    queryKey: ['motoristas-ofertas'],
    queryFn: () => base44.entities.Motorista.list()
  });

  const aceitarOfertaMutation = useMutation({
    mutationFn: async (oferta) => {
      // Atualizar oferta para aceita
      await base44.entities.Oferta.update(oferta.id, {
        status: 'aceita',
        data_aceite: new Date().toISOString()
      });

      // Recusar outras ofertas
      const outrasOfertas = ofertas.filter(o => o.id !== oferta.id && o.status === 'pendente');
      await Promise.all(
        outrasOfertas.map(o => 
          base44.entities.Oferta.update(o.id, { status: 'recusada' })
        )
      );

      // Atualizar pedido
      await base44.entities.Pedido.update(pedidoId, {
        motorista_id: oferta.motorista_id,
        motorista_nome: oferta.motorista_nome,
        valor_total: oferta.valor_proposto,
        status: 'confirmado'
      });

      // Notificar motorista
      await base44.entities.Notificacao.create({
        usuario_email: oferta.motorista_email,
        tipo: 'status_atualizado',
        titulo: 'Oferta aceita! 🎉',
        descricao: `Sua oferta de R$ ${oferta.valor_proposto.toFixed(2)} foi aceita`,
        pedido_id: pedidoId,
        icone: '✅',
        cor: '#10b981'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ofertas-pedido']);
      queryClient.invalidateQueries(['pedido', pedidoId]);
      toast.success('Oferta aceita com sucesso!');
    }
  });

  const recusarOfertaMutation = useMutation({
    mutationFn: async (ofertaId) => {
      await base44.entities.Oferta.update(ofertaId, {
        status: 'recusada'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ofertas-pedido']);
      toast.success('Oferta recusada');
    }
  });

  const getMotoristaInfo = (motoristaId) => {
    return motoristas.find(m => m.id === motoristaId);
  };

  const ofertasPendentes = ofertas.filter(o => o.status === 'pendente');
  const ofertaAceita = ofertas.find(o => o.status === 'aceita');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (ofertas.length === 0) {
    return (
      <Card className="border-slate-100 rounded-2xl">
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Nenhuma oferta ainda</h3>
          <p className="text-slate-500 text-sm">
            Aguarde motoristas enviarem propostas para este frete
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ofertaAceita && (
        <Card className="border-green-200 bg-green-50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              Oferta Aceita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800 mb-1">
                  {ofertaAceita.motorista_nome}
                </p>
                <p className="text-2xl font-bold text-green-700 mb-2">
                  R$ {ofertaAceita.valor_proposto.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600">
                  Prazo: {ofertaAceita.prazo_horas}h
                </p>
              </div>
            </div>
            {ofertaAceita.mensagem && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-slate-700">{ofertaAceita.mensagem}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {ofertasPendentes.length > 0 && (
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">
              Ofertas Recebidas ({ofertasPendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ofertasPendentes.map((oferta) => {
              const motorista = getMotoristaInfo(oferta.motorista_id);
              return (
                <motion.div
                  key={oferta.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {oferta.motorista_nome}
                        </p>
                        {motorista?.avaliacao_media_motorista && (
                          <AvaliacaoDisplay
                            nota={motorista.avaliacao_media_motorista}
                            totalAvaliacoes={motorista.total_avaliacoes_motorista || 0}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {oferta.valor_proposto.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {oferta.prazo_horas}h
                      </p>
                    </div>
                  </div>

                  {oferta.mensagem && (
                    <div className="mb-3 p-3 bg-white rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                        <p className="text-sm text-slate-700">{oferta.mensagem}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => aceitarOfertaMutation.mutate(oferta)}
                      disabled={aceitarOfertaMutation.isPending || pedido?.status !== 'pendente'}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                    >
                      {aceitarOfertaMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => recusarOfertaMutation.mutate(oferta.id)}
                      disabled={recusarOfertaMutation.isPending}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      {recusarOfertaMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Recusar
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}