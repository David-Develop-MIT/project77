import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { pedido_id, aceitar } = await req.json();
    
    if (!pedido_id || aceitar === undefined) {
      return Response.json({ 
        error: 'pedido_id e aceitar são obrigatórios' 
      }, { status: 400 });
    }
    
    // Buscar pedido
    const pedidos = await base44.asServiceRole.entities.Pedido.list();
    const pedido = pedidos.find(p => p.id === pedido_id);
    
    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    // Verificar se o usuário é o motorista sugerido
    if (pedido.motorista_sugerido_id !== user.motorista_id) {
      return Response.json({ 
        error: 'Você não é o motorista sugerido para este pedido' 
      }, { status: 403 });
    }
    
    if (aceitar) {
      // Aceitar pedido
      await base44.asServiceRole.entities.Pedido.update(pedido.id, {
        motorista_id: user.motorista_id,
        motorista_nome: user.full_name,
        status: 'confirmado',
        status_alocacao: 'aceito'
      });
      
      // Atualizar status do motorista
      const motoristas = await base44.asServiceRole.entities.Motorista.list();
      const motorista = motoristas.find(m => m.id === user.motorista_id);
      if (motorista) {
        await base44.asServiceRole.entities.Motorista.update(motorista.id, {
          status: 'ocupado'
        });
      }
      
      // Notificar cliente
      await base44.asServiceRole.entities.Notificacao.create({
        usuario_email: pedido.created_by,
        tipo: 'status_atualizado',
        titulo: '✅ Motorista Confirmado!',
        descricao: `${user.full_name} aceitou seu pedido e está a caminho.`,
        pedido_id: pedido.id,
        icone: '✅',
        cor: '#10b981'
      });
      
      return Response.json({
        success: true,
        message: 'Pedido aceito com sucesso',
        pedido_id: pedido.id
      });
      
    } else {
      // Recusar pedido
      await base44.asServiceRole.entities.Pedido.update(pedido.id, {
        motorista_sugerido_id: null,
        status_alocacao: 'recusado'
      });
      
      // Tentar realocar para outro motorista
      try {
        const response = await fetch(
          `${req.headers.get('origin')}/api/functions/alocarPedido`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization')
            },
            body: JSON.stringify({ pedido_id })
          }
        );
        
        const resultado = await response.json();
        
        return Response.json({
          success: true,
          message: 'Pedido recusado',
          realocado: resultado.success,
          novo_motorista: resultado.motorista_nome
        });
        
      } catch (error) {
        return Response.json({
          success: true,
          message: 'Pedido recusado, mas não foi possível realocar automaticamente'
        });
      }
    }
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});