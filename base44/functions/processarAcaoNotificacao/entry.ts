import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { acao, tipo, dados } = await req.json();

    let resultado = {};

    switch (acao) {
      case 'aceitar_oferta': {
        const { oferta_id, pedido_id } = dados;
        
        // Atualizar oferta
        await base44.asServiceRole.entities.Oferta.update(oferta_id, {
          status: 'aceita',
          data_aceite: new Date().toISOString()
        });

        // Atualizar pedido
        const ofertas = await base44.asServiceRole.entities.Oferta.list();
        const oferta = ofertas.find(o => o.id === oferta_id);
        
        if (oferta) {
          await base44.asServiceRole.entities.Pedido.update(pedido_id, {
            status: 'confirmado',
            motorista_id: oferta.motorista_id,
            motorista_nome: oferta.motorista_nome,
            valor_total: oferta.valor_proposto
          });

          // Criar conversa se não existir
          const conversas = await base44.asServiceRole.entities.Conversa.list();
          const conversaExistente = conversas.find(c => 
            c.pedido_id === pedido_id && 
            c.participantes?.includes(user.email) && 
            c.participantes?.includes(oferta.motorista_email)
          );

          if (!conversaExistente) {
            const pedidos = await base44.asServiceRole.entities.Pedido.list();
            const pedido = pedidos.find(p => p.id === pedido_id);

            await base44.asServiceRole.entities.Conversa.create({
              pedido_id: pedido_id,
              participantes: [user.email, oferta.motorista_email],
              participantes_nomes: {
                [user.email]: pedido.nome_cliente,
                [oferta.motorista_email]: oferta.motorista_nome
              },
              tipo: 'pedido',
              ativa: true
            });
          }
        }

        resultado = { sucesso: true, mensagem: 'Oferta aceita com sucesso!' };
        break;
      }

      case 'responder_mensagem': {
        const { conversa_id, url } = dados;
        resultado = { 
          sucesso: true, 
          redirect: url || '/Chat',
          mensagem: 'Redirecionando para o chat...' 
        };
        break;
      }

      case 'ver_pedido': {
        const { pedido_id } = dados;
        resultado = { 
          sucesso: true, 
          redirect: `/DetalhePedido?id=${pedido_id}`,
          mensagem: 'Abrindo pedido...' 
        };
        break;
      }

      case 'aceitar_pedido': {
        const { pedido_id } = dados;
        
        const usuarios = await base44.asServiceRole.entities.UsuarioPickup.list();
        const usuario = usuarios.find(u => u.email === user.email);

        if (!usuario?.motorista_id) {
          return Response.json({ 
            error: 'Você precisa ser motorista para aceitar pedidos' 
          }, { status: 400 });
        }

        const motoristas = await base44.asServiceRole.entities.Motorista.list();
        const motorista = motoristas.find(m => m.id === usuario.motorista_id);

        await base44.asServiceRole.entities.Pedido.update(pedido_id, {
          status: 'confirmado',
          motorista_id: motorista.id,
          motorista_nome: motorista.nome
        });

        resultado = { 
          sucesso: true, 
          mensagem: 'Pedido aceito! Boa viagem!',
          redirect: `/MeusPedidosMotorista`
        };
        break;
      }

      default:
        return Response.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }

    return Response.json(resultado);

  } catch (error) {
    console.error('Erro ao processar ação:', error);
    return Response.json({ 
      error: 'Erro ao processar ação',
      detalhes: error.message 
    }, { status: 500 });
  }
});