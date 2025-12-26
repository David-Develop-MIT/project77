import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentMethodCard from '@/components/PaymentMethodCard';
import { toast } from 'sonner';

export default function PagarPedido() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('id');
  
  const [metodoPagamento, setMetodoPagamento] = useState('');

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

  const { data: metodosPagamento = [] } = useQuery({
    queryKey: ['metodos-pagamento', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const metodos = await base44.entities.MetodoPagamento.list();
      return metodos.filter(m => m.usuario_email === user.email);
    },
    enabled: !!user?.email
  });

  const pagarMutation = useMutation({
    mutationFn: async () => {
      // Se for cartão de crédito
      if (metodoPagamento === 'cartao_credito') {
        const cartaoPadrao = metodosPagamento.find(m => m.padrao) || metodosPagamento[0];
        
        if (!cartaoPadrao) {
          throw new Error('Nenhum cartão cadastrado');
        }

        const response = await base44.functions.invoke('criarCheckoutStripe', {
          pedido_id: pedido.id,
          valor: pedido.valor_total,
          metodo_pagamento: 'cartao_credito',
          payment_method_id: cartaoPadrao.stripe_payment_method_id
        });
        
        if (response?.data?.checkout_url) {
          window.location.href = response.data.checkout_url;
          return;
        }
      }
      
      // Se for PIX
      if (metodoPagamento === 'pix') {
        const response = await base44.functions.invoke('criarCheckoutStripe', {
          pedido_id: pedido.id,
          valor: pedido.valor_total,
          metodo_pagamento: 'pix'
        });
        
        if (response?.data?.payment_intent_id) {
          navigate(createPageUrl('PagamentoPix') + `?pedido_id=${pedido.id}&payment_intent_id=${response.data.payment_intent_id}`);
          return;
        } else {
          throw new Error('Erro ao gerar pagamento PIX');
        }
      }
    },
    onError: (error) => {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    }
  });

  const handlePagar = () => {
    if (!metodoPagamento) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    if (metodoPagamento === 'cartao_credito' && metodosPagamento.length === 0) {
      toast.error('Você precisa cadastrar um cartão primeiro');
      setTimeout(() => {
        navigate(createPageUrl('Carteira') + '?tab=cartoes');
      }, 1500);
      return;
    }

    pagarMutation.mutate();
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
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('DetalhePedido') + `?id=${pedido.id}`)}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Pagamento do Pedido</h1>
            <p className="text-slate-500">Escolha o método de pagamento</p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Resumo do Pedido */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Serviço</span>
                <span className="font-medium text-slate-800">{pedido.tipo_servico}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Origem</span>
                <span className="font-medium text-slate-800 text-right text-sm">
                  {pedido.endereco_origem}
                </span>
              </div>
              {pedido.endereco_destino && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Destino</span>
                  <span className="font-medium text-slate-800 text-right text-sm">
                    {pedido.endereco_destino}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-800">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  R$ {pedido.valor_total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PaymentMethodCard
                  method="pix"
                  selected={metodoPagamento === 'pix'}
                  onClick={() => setMetodoPagamento('pix')}
                />
                <PaymentMethodCard
                  method="cartao_credito"
                  selected={metodoPagamento === 'cartao_credito'}
                  onClick={() => setMetodoPagamento('cartao_credito')}
                />
              </div>

              {metodoPagamento === 'cartao_credito' && metodosPagamento.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Cartão Selecionado
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {(metodosPagamento.find(m => m.padrao) || metodosPagamento[0]).bandeira} •••• {(metodosPagamento.find(m => m.padrao) || metodosPagamento[0]).ultimos_digitos}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de Pagamento */}
          <Button
            onClick={handlePagar}
            disabled={!metodoPagamento || pagarMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl h-14 text-lg font-semibold shadow-lg shadow-orange-500/25"
          >
            {pagarMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}