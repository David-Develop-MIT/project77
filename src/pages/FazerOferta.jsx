import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, DollarSign, Clock, MessageSquare, Send, MapPin, Package, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { servicoConfig } from '@/components/servicoConfig';
import { toast } from 'sonner';

export default function FazerOferta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedido');

  const [ofertaData, setOfertaData] = useState({
    valor_proposto: '',
    prazo_horas: '',
    mensagem: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedido, isLoading } = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: async () => {
      const pedidos = await base44.entities.Pedido.list();
      return pedidos.find(p => p.id === pedidoId);
    },
    enabled: !!pedidoId
  });

  const { data: motorista } = useQuery({
    queryKey: ['motorista', user?.email],
    queryFn: async () => {
      const motoristas = await base44.entities.Motorista.list();
      return motoristas.find(m => m.created_by === user?.email);
    },
    enabled: !!user?.email
  });

  const { data: minhasOfertas = [] } = useQuery({
    queryKey: ['minhas-ofertas', pedidoId, motorista?.id],
    queryFn: async () => {
      const ofertas = await base44.entities.Oferta.list();
      return ofertas.filter(o => o.pedido_id === pedidoId && o.motorista_id === motorista?.id);
    },
    enabled: !!pedidoId && !!motorista?.id
  });

  const criarOfertaMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Oferta.create(data);
      
      // Criar notificação para o cliente
      await base44.entities.Notificacao.create({
        usuario_email: pedido.created_by,
        tipo: 'novo_pedido',
        titulo: 'Nova oferta recebida',
        descricao: `${motorista.nome} enviou uma oferta de R$ ${data.valor_proposto} para seu pedido`,
        pedido_id: pedidoId,
        icone: '💰',
        cor: '#10b981'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['minhas-ofertas']);
      toast.success('Oferta enviada com sucesso!');
      navigate(createPageUrl('PedidosDisponiveis'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!ofertaData.valor_proposto || parseFloat(ofertaData.valor_proposto) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    if (!ofertaData.prazo_horas || parseInt(ofertaData.prazo_horas) <= 0) {
      toast.error('Informe um prazo válido');
      return;
    }

    criarOfertaMutation.mutate({
      pedido_id: pedidoId,
      motorista_id: motorista.id,
      motorista_nome: motorista.nome,
      motorista_email: user.email,
      valor_proposto: parseFloat(ofertaData.valor_proposto),
      prazo_horas: parseInt(ofertaData.prazo_horas),
      mensagem: ofertaData.mensagem,
      status: 'pendente'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Pedido não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl('PedidosDisponiveis'))}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const servico = servicoConfig[pedido.tipo_servico];
  const Icon = servico?.icon;
  const jaEnviouOferta = minhasOfertas.some(o => o.status === 'pendente');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('PedidosDisponiveis'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fazer Oferta</h1>
            <p className="text-slate-500">Envie sua proposta para este frete</p>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Detalhes do Pedido */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-slate-100 rounded-2xl">
              <div className="h-2" style={{ backgroundColor: servico?.color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${servico?.color}15` }}
                    >
                      {Icon && <Icon className="w-6 h-6" style={{ color: servico?.color }} />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{servico?.title}</CardTitle>
                      <p className="text-sm text-slate-500">{pedido.nome_cliente}</p>
                    </div>
                  </div>
                  <StatusBadge status={pedido.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Origem</p>
                      <p className="font-medium text-slate-800">{pedido.endereco_origem}</p>
                    </div>
                  </div>
                </div>

                {pedido.endereco_destino && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Destino</p>
                        <p className="font-medium text-slate-800">{pedido.endereco_destino}</p>
                      </div>
                    </div>
                  </div>
                )}

                {pedido.distancia_km && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-600">
                      📍 Distância: <span className="font-semibold">{pedido.distancia_km} km</span>
                    </p>
                  </div>
                )}

                {pedido.descricao && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Descrição</p>
                    <p className="text-slate-700">{pedido.descricao}</p>
                  </div>
                )}

                {pedido.valor_calculado && (
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <p className="text-orange-100 text-xs mb-1">Valor Sugerido</p>
                    <p className="text-2xl font-bold">R$ {pedido.valor_calculado.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Formulário de Oferta */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle>Sua Oferta</CardTitle>
              </CardHeader>
              <CardContent>
                {jaEnviouOferta ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">Oferta Enviada</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Você já enviou uma oferta para este frete. Aguarde a resposta do cliente.
                    </p>
                    <div className="space-y-2">
                      {minhasOfertas.filter(o => o.status === 'pendente').map(oferta => (
                        <div key={oferta.id} className="p-4 bg-slate-50 rounded-xl text-left">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800">
                              R$ {oferta.valor_proposto.toFixed(2)}
                            </span>
                            <span className="text-sm text-slate-500">
                              {oferta.prazo_horas}h
                            </span>
                          </div>
                          {oferta.mensagem && (
                            <p className="text-sm text-slate-600">{oferta.mensagem}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Valor Proposto (R$)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ofertaData.valor_proposto}
                        onChange={(e) => setOfertaData(prev => ({ ...prev, valor_proposto: e.target.value }))}
                        placeholder="Ex: 50.00"
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <Clock className="w-4 h-4" />
                        Prazo Estimado (horas)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={ofertaData.prazo_horas}
                        onChange={(e) => setOfertaData(prev => ({ ...prev, prazo_horas: e.target.value }))}
                        placeholder="Ex: 2"
                        className="rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Mensagem (Opcional)
                      </label>
                      <Textarea
                        value={ofertaData.mensagem}
                        onChange={(e) => setOfertaData(prev => ({ ...prev, mensagem: e.target.value }))}
                        placeholder="Adicione uma mensagem para o cliente..."
                        className="rounded-xl h-24"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={criarOfertaMutation.isPending}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11"
                    >
                      {criarOfertaMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Oferta
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}