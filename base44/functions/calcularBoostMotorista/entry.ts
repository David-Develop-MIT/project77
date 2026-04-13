import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calcular boost baseado em desempenho
function calcularBoostScore(stats) {
  let boost = 0;
  
  // Fator 1: Total de entregas concluídas (até +3 pontos)
  const entregasConcluidas = stats.entregasConcluidas || 0;
  if (entregasConcluidas >= 100) boost += 3;
  else if (entregasConcluidas >= 50) boost += 2;
  else if (entregasConcluidas >= 20) boost += 1;
  
  // Fator 2: Taxa de conclusão (até +2 pontos)
  const taxaConclusao = stats.totalEntregas > 0 
    ? (stats.entregasConcluidas / stats.totalEntregas) 
    : 0;
  if (taxaConclusao >= 0.95) boost += 2;
  else if (taxaConclusao >= 0.85) boost += 1;
  
  // Fator 3: Avaliação média recente (até +3 pontos)
  const avaliacaoMedia = stats.avaliacaoMediaRecente || 0;
  if (avaliacaoMedia >= 4.8 && stats.totalAvaliacoesRecentes >= 10) boost += 3;
  else if (avaliacaoMedia >= 4.5 && stats.totalAvaliacoesRecentes >= 5) boost += 2;
  else if (avaliacaoMedia >= 4.0) boost += 1;
  
  // Fator 4: Tempo médio de entrega (até +2 pontos)
  // Motoristas mais rápidos ganham pontos
  const tempoMedio = stats.tempoMedioEntrega || 0;
  if (tempoMedio > 0 && tempoMedio <= 30) boost += 2; // ≤ 30 min
  else if (tempoMedio > 0 && tempoMedio <= 45) boost += 1; // ≤ 45 min
  
  return Math.min(boost, 10); // Máximo de 10 pontos
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { motorista_email, recalcular_todos } = await req.json();
    
    // Se recalcular_todos, processar todos os motoristas (admin only)
    if (recalcular_todos) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
      }
      
      const motoristas = await base44.asServiceRole.entities.Motorista.list();
      const users = await base44.asServiceRole.entities.User.list();
      const resultados = [];
      
      for (const motorista of motoristas) {
        const user = users.find(u => u.motorista_id === motorista.id);
        if (!user) continue;
        
        const boost = await calcularBoostParaMotorista(base44, user.email);
        resultados.push({
          email: user.email,
          boost_anterior: user.boost_nivel || 0,
          boost_novo: boost
        });
      }
      
      return Response.json({
        success: true,
        total_processados: resultados.length,
        resultados
      });
    }
    
    // Calcular boost para um motorista específico
    if (!motorista_email) {
      return Response.json({ error: 'motorista_email é obrigatório' }, { status: 400 });
    }
    
    const boost = await calcularBoostParaMotorista(base44, motorista_email);
    
    return Response.json({
      success: true,
      motorista_email,
      boost_nivel: boost
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function calcularBoostParaMotorista(base44, motoristaEmail) {
  // Buscar dados do motorista
  const users = await base44.asServiceRole.entities.User.list();
  const user = users.find(u => u.email === motoristaEmail);
  
  if (!user || !user.motorista_id) {
    throw new Error('Motorista não encontrado');
  }
  
  // Buscar pedidos do motorista
  const pedidos = await base44.asServiceRole.entities.Pedido.list('-created_date', 500);
  const pedidosMotorista = pedidos.filter(p => p.motorista_id === user.motorista_id);
  
  const entregasConcluidas = pedidosMotorista.filter(p => p.status === 'concluido');
  
  // Calcular tempo médio de entrega (simplificado)
  let tempoMedioEntrega = 0;
  if (entregasConcluidas.length > 0) {
    const tempos = entregasConcluidas
      .filter(p => p.tempo_estimado)
      .map(p => {
        const match = p.tempo_estimado.match(/(\d+)/);
        return match ? parseInt(match[0]) : 0;
      });
    
    if (tempos.length > 0) {
      tempoMedioEntrega = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    }
  }
  
  // Buscar avaliações recentes (últimos 30 dias)
  const avaliacoes = await base44.asServiceRole.entities.Avaliacao.list('-created_date', 200);
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);
  
  const avaliacoesRecentes = avaliacoes.filter(a => 
    a.avaliado_email === motoristaEmail &&
    a.tipo_avaliador === 'cliente' &&
    new Date(a.created_date) >= dataLimite
  );
  
  const avaliacaoMediaRecente = avaliacoesRecentes.length > 0
    ? avaliacoesRecentes.reduce((acc, a) => acc + a.nota, 0) / avaliacoesRecentes.length
    : user.avaliacao_media_motorista || 0;
  
  // Calcular boost
  const stats = {
    totalEntregas: pedidosMotorista.length,
    entregasConcluidas: entregasConcluidas.length,
    avaliacaoMediaRecente,
    totalAvaliacoesRecentes: avaliacoesRecentes.length,
    tempoMedioEntrega
  };
  
  const boostCalculado = calcularBoostScore(stats);
  
  // Manter boost manual se for maior (admin pode ter ajustado)
  const boostManual = user.boost_manual || 0;
  const boostFinal = Math.max(boostCalculado, boostManual);
  
  // Atualizar no banco
  await base44.asServiceRole.entities.User.update(user.id, {
    boost_nivel: boostFinal,
    boost_automatico: boostCalculado,
    boost_manual: boostManual
  });
  
  return boostFinal;
}