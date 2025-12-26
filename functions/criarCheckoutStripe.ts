import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    console.log('🔵 Iniciando criarCheckoutStripe');
    
    const user = await base44.auth.me();
    console.log('✅ Usuário:', user?.email);

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { pedido_id, valor, metodo_pagamento } = await req.json();
    console.log('📦 Dados:', { pedido_id, valor, metodo_pagamento });

    if (!pedido_id || !valor || !metodo_pagamento) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar pedido usando service role para ter acesso completo
    const pedidos = await base44.asServiceRole.entities.Pedido.list();
    const pedido = pedidos.find(p => p.id === pedido_id);
    console.log('📋 Pedido encontrado:', pedido?.id);

    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se o pedido pertence ao usuário
    if (pedido.created_by !== user.email) {
      console.error('❌ Pedido não pertence ao usuário');
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const appHost = req.headers.get('origin') || 'http://localhost:5173';

    if (metodo_pagamento === 'cartao_credito' || metodo_pagamento === 'cartao_debito') {
      // Criar sessão de checkout do Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Pedido #${pedido_id.slice(0, 8)}`,
                description: pedido.descricao || 'Serviço de entrega',
              },
              unit_amount: Math.round(valor * 100), // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appHost}/PagamentoSucesso?pedido_id=${pedido_id}`,
        cancel_url: `${appHost}/PagamentoCancelado?pedido_id=${pedido_id}`,
        customer_email: user.email,
        metadata: {
          pedido_id: pedido_id,
          user_email: user.email,
        },
      });

      // Criar transação
      await base44.asServiceRole.entities.Transacao.create({
        pedido_id: pedido_id,
        cliente_email: user.email,
        valor: valor,
        taxa_plataforma: valor * 0.1, // 10% de taxa
        valor_motorista: valor * 0.9,
        status: 'processando',
        stripe_payment_intent_id: session.id,
      });

      return Response.json({
        checkout_url: session.url,
        session_id: session.id,
      });
    } else if (metodo_pagamento === 'pix') {
      // Para PIX, criar PaymentIntent com PIX habilitado
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(valor * 100),
        currency: 'brl',
        payment_method_types: ['pix'],
        metadata: {
          pedido_id: pedido_id,
          user_email: user.email,
        },
      });

      // Criar transação
      await base44.asServiceRole.entities.Transacao.create({
        pedido_id: pedido_id,
        cliente_email: user.email,
        valor: valor,
        taxa_plataforma: valor * 0.1,
        valor_motorista: valor * 0.9,
        status: 'pendente',
        stripe_payment_intent_id: paymentIntent.id,
      });

      return Response.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    }

    return Response.json({ error: 'Método de pagamento inválido' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});