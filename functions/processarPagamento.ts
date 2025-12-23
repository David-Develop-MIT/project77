import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { pedido_id, metodo_pagamento_id } = await req.json();

    // Buscar pedido
    const pedidos = await base44.entities.Pedido.list();
    const pedido = pedidos.find(p => p.id === pedido_id);

    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.created_by !== user.email) {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar método de pagamento
    const metodos = await base44.asServiceRole.entities.MetodoPagamento.list();
    const metodo = metodos.find(m => m.id === metodo_pagamento_id);

    if (!metodo || metodo.usuario_email !== user.email) {
      return Response.json({ error: 'Método de pagamento inválido' }, { status: 400 });
    }

    // Calcular taxas (15% para a plataforma)
    const valorTotal = pedido.valor_total;
    const taxaPlataforma = valorTotal * 0.15;
    const valorMotorista = valorTotal - taxaPlataforma;

    // Criar transação
    const transacao = await base44.asServiceRole.entities.Transacao.create({
      pedido_id: pedido.id,
      cliente_email: user.email,
      motorista_email: pedido.motorista_id ? null : null, // será preenchido depois
      valor: valorTotal,
      taxa_plataforma: taxaPlataforma,
      valor_motorista: valorMotorista,
      metodo_pagamento_id: metodo.id,
      status: 'processando'
    });

    try {
      // Criar PaymentIntent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(valorTotal * 100), // Centavos
        currency: 'brl',
        payment_method: metodo.stripe_payment_method_id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          pedido_id: pedido.id,
          transacao_id: transacao.id
        }
      });

      // Atualizar transação
      await base44.asServiceRole.entities.Transacao.update(transacao.id, {
        status: paymentIntent.status === 'succeeded' ? 'concluida' : 'processando',
        stripe_payment_intent_id: paymentIntent.id
      });

      // Atualizar pedido
      if (paymentIntent.status === 'succeeded') {
        await base44.asServiceRole.entities.Pedido.update(pedido.id, {
          status_pagamento: 'pago'
        });
      }

      return Response.json({
        success: true,
        transacao_id: transacao.id,
        status: paymentIntent.status
      });

    } catch (error) {
      // Atualizar transação com erro
      await base44.asServiceRole.entities.Transacao.update(transacao.id, {
        status: 'falhada',
        erro_mensagem: error.message
      });

      return Response.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});