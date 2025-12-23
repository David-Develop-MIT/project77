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

    const { payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return Response.json({ error: 'ID do pagamento não fornecido' }, { status: 400 });
    }

    // Buscar PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!paymentIntent) {
      return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    // Extrair dados do PIX
    let pixData = null;

    if (paymentIntent.next_action?.type === 'pix_display_qr_code') {
      const pixInfo = paymentIntent.next_action.pix_display_qr_code;
      pixData = {
        qr_code_url: pixInfo.image_url_svg || pixInfo.image_url_png,
        pix_codigo: pixInfo.data,
        valor: paymentIntent.amount / 100,
        expires_at: pixInfo.expires_at,
      };
    } else {
      // Se ainda não tem o QR Code, pode estar processando
      // Confirmar o PaymentIntent para gerar o QR Code
      const confirmedIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
        payment_method_types: ['pix'],
      });

      if (confirmedIntent.next_action?.type === 'pix_display_qr_code') {
        const pixInfo = confirmedIntent.next_action.pix_display_qr_code;
        pixData = {
          qr_code_url: pixInfo.image_url_svg || pixInfo.image_url_png,
          pix_codigo: pixInfo.data,
          valor: confirmedIntent.amount / 100,
          expires_at: pixInfo.expires_at,
        };
      }
    }

    if (!pixData) {
      return Response.json({ error: 'Dados PIX não disponíveis' }, { status: 400 });
    }

    return Response.json(pixData);
  } catch (error) {
    console.error('Erro ao obter dados PIX:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});