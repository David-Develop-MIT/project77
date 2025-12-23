import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Apenas admins podem gerar faturas
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    const { motorista_email, periodo_inicio, periodo_fim } = await req.json();
    
    if (!motorista_email || !periodo_inicio || !periodo_fim) {
      return Response.json({ 
        error: 'motorista_email, periodo_inicio e periodo_fim são obrigatórios' 
      }, { status: 400 });
    }
    
    // Buscar transações do motorista no período
    const transacoes = await base44.asServiceRole.entities.Transacao.list('-created_date', 1000);
    const transacoesPeriodo = transacoes.filter(t => {
      if (t.motorista_email !== motorista_email || t.status !== 'concluida') return false;
      
      const dataTrans = new Date(t.created_date);
      const inicio = new Date(periodo_inicio);
      const fim = new Date(periodo_fim);
      
      return dataTrans >= inicio && dataTrans <= fim;
    });
    
    if (transacoesPeriodo.length === 0) {
      return Response.json({ 
        success: false,
        message: 'Nenhuma transação encontrada no período' 
      });
    }
    
    // Calcular totais
    const valorBruto = transacoesPeriodo.reduce((acc, t) => acc + (t.valor || 0), 0);
    const taxas = transacoesPeriodo.reduce((acc, t) => acc + (t.taxa_plataforma || 0), 0);
    const valorLiquido = transacoesPeriodo.reduce((acc, t) => acc + (t.valor_motorista || 0), 0);
    
    // Buscar dados bancários do motorista
    const dadosBancarios = await base44.asServiceRole.entities.DadosBancarios.list();
    const dadosMotorista = dadosBancarios.find(d => d.motorista_email === motorista_email);
    
    // Criar fatura
    const fatura = await base44.asServiceRole.entities.Fatura.create({
      motorista_email,
      periodo_inicio,
      periodo_fim,
      total_entregas: transacoesPeriodo.length,
      valor_bruto: valorBruto,
      taxas: taxas,
      valor_liquido: valorLiquido,
      transacoes: transacoesPeriodo.map(t => t.id),
      status: 'fechada',
      dados_bancarios_id: dadosMotorista?.id
    });
    
    // Notificar motorista
    await base44.asServiceRole.entities.Notificacao.create({
      usuario_email: motorista_email,
      tipo: 'mensagem_sistema',
      titulo: '💰 Nova Fatura Disponível',
      descricao: `Sua fatura de ${new Date(periodo_inicio).toLocaleDateString('pt-BR')} a ${new Date(periodo_fim).toLocaleDateString('pt-BR')} está pronta. Valor: R$ ${valorLiquido.toFixed(2)}`,
      icone: '💰',
      cor: '#10b981'
    });
    
    return Response.json({
      success: true,
      fatura_id: fatura.id,
      total_entregas: transacoesPeriodo.length,
      valor_liquido: valorLiquido
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});