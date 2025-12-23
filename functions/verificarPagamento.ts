import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { pedido_id } = await req.json();

    if (!pedido_id) {
      return Response.json({ error: 'ID do pedido não fornecido' }, { status: 400 });
    }

    // Buscar transação
    const transacoes = await base44.asServiceRole.entities.Transacao.list();
    const transacao = transacoes.find(t => t.pedido_id === pedido_id);

    if (!transacao) {
      return Response.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    // Verificar status no Stripe
    let status = transacao.status;
    
    if (transacao.stripe_payment_intent_id) {
      try {
        let stripeObj;
        
        // Verificar se é sessão ou payment intent
        if (transacao.stripe_payment_intent_id.startsWith('cs_')) {
          stripeObj = await stripe.checkout.sessions.retrieve(transacao.stripe_payment_intent_id);
          
          if (stripeObj.payment_status === 'paid') {
            status = 'concluida';
          } else if (stripeObj.payment_status === 'unpaid') {
            status = 'pendente';
          }
        } else {
          stripeObj = await stripe.paymentIntents.retrieve(transacao.stripe_payment_intent_id);
          
          if (stripeObj.status === 'succeeded') {
            status = 'concluida';
          } else if (stripeObj.status === 'processing') {
            status = 'processando';
          } else if (stripeObj.status === 'requires_payment_method' || stripeObj.status === 'requires_confirmation') {
            status = 'pendente';
          } else if (stripeObj.status === 'canceled') {
            status = 'falhada';
          }
        }

        // Atualizar transação se mudou
        if (status !== transacao.status) {
          await base44.asServiceRole.entities.Transacao.update(transacao.id, { status });
          
          // Se pago, atualizar pedido
          if (status === 'concluida') {
            await base44.asServiceRole.entities.Pedido.update(pedido_id, {
              status_pagamento: 'pago',
              status: 'confirmado'
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar no Stripe:', error);
      }
    }

    return Response.json({
      status,
      transacao_id: transacao.id,
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});