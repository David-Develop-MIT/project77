import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Apenas admins podem aprovar faturas
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    const { fatura_id, aprovar, observacoes } = await req.json();
    
    if (!fatura_id || aprovar === undefined) {
      return Response.json({ 
        error: 'fatura_id e aprovar são obrigatórios' 
      }, { status: 400 });
    }
    
    // Buscar fatura
    const faturas = await base44.asServiceRole.entities.Fatura.list();
    const fatura = faturas.find(f => f.id === fatura_id);
    
    if (!fatura) {
      return Response.json({ error: 'Fatura não encontrada' }, { status: 404 });
    }
    
    if (aprovar) {
      // Aprovar fatura
      await base44.asServiceRole.entities.Fatura.update(fatura_id, {
        status: 'aprovada',
        aprovado_por: user.email,
        data_aprovacao: new Date().toISOString(),
        observacoes: observacoes || fatura.observacoes
      });
      
      // Notificar motorista
      await base44.asServiceRole.entities.Notificacao.create({
        usuario_email: fatura.motorista_email,
        tipo: 'mensagem_sistema',
        titulo: '✅ Fatura Aprovada!',
        descricao: `Sua fatura de R$ ${fatura.valor_liquido.toFixed(2)} foi aprovada. O pagamento será processado em breve.`,
        icone: '✅',
        cor: '#10b981'
      });
      
      return Response.json({
        success: true,
        message: 'Fatura aprovada com sucesso'
      });
      
    } else {
      // Rejeitar fatura
      await base44.asServiceRole.entities.Fatura.update(fatura_id, {
        status: 'rejeitada',
        aprovado_por: user.email,
        observacoes: observacoes || 'Fatura rejeitada pelo administrador'
      });
      
      // Notificar motorista
      await base44.asServiceRole.entities.Notificacao.create({
        usuario_email: fatura.motorista_email,
        tipo: 'mensagem_sistema',
        titulo: '❌ Fatura Rejeitada',
        descricao: `Sua fatura foi rejeitada. Motivo: ${observacoes || 'Entre em contato com o suporte'}`,
        icone: '❌',
        cor: '#ef4444'
      });
      
      return Response.json({
        success: true,
        message: 'Fatura rejeitada'
      });
    }
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});