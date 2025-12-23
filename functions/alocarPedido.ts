import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Função para calcular distância entre dois pontos (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Verificar se motorista está disponível no horário
function verificarDisponibilidade(motorista, dataAgendada) {
  if (!dataAgendada || !motorista.disponibilidade_horario) return true;
  
  const data = new Date(dataAgendada);
  const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const dia = diasSemana[data.getDay()];
  
  const disponibilidade = motorista.disponibilidade_horario[dia];
  return disponibilidade?.ativo || false;
}

// Verificar compatibilidade do veículo
function verificarVeiculo(pedido, motorista) {
  const compatibilidade = {
    motoboy: ['moto'],
    comida: ['moto', 'carro'],
    frete: ['moto', 'carro', 'van'],
    carreto: ['carro', 'van', 'caminhao'],
    mudanca: ['van', 'caminhao'],
    entulho: ['caminhao']
  };
  
  const veiculosAceitos = compatibilidade[pedido.tipo_servico] || [];
  return veiculosAceitos.includes(motorista.veiculo_tipo);
}

// Calcular score do motorista
function calcularScore(motorista, pedido, distancia) {
  let score = 100;
  
  // Penalizar por distância (até -30 pontos)
  score -= Math.min(distancia * 2, 30);
  
  // Bonificar por avaliação (até +20 pontos)
  const avaliacao = motorista.avaliacao_media_motorista || 0;
  score += avaliacao * 4;
  
  // CRÍTICO: Bonificar por boost/prioridade (até +40 pontos)
  // Boost é o fator mais importante para priorização
  const boost = motorista.boost_nivel || 0;
  score += boost * 4; // Multiplicador aumentado de 3 para 4
  
  // Bonificar se veículo é compatível (+10 pontos)
  if (verificarVeiculo(pedido, motorista)) {
    score += 10;
  }
  
  // Bonificar por histórico de entregas (+15 pontos para experientes)
  const totalEntregas = motorista.total_entregas || 0;
  if (totalEntregas >= 100) score += 15;
  else if (totalEntregas >= 50) score += 10;
  else if (totalEntregas >= 20) score += 5;
  
  // Penalizar se motorista está ocupado (-50 pontos)
  if (motorista.status === 'ocupado') {
    score -= 50;
  }
  
  return Math.max(0, score);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Autenticação de serviço
    const { pedido_id } = await req.json();
    
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id é obrigatório' }, { status: 400 });
    }
    
    // Buscar pedido
    const pedidos = await base44.asServiceRole.entities.Pedido.list();
    const pedido = pedidos.find(p => p.id === pedido_id);
    
    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    // Se já tem motorista, retornar
    if (pedido.motorista_id) {
      return Response.json({ 
        success: false, 
        message: 'Pedido já tem motorista alocado' 
      });
    }
    
    // Obter coordenadas do pedido usando LLM
    let latOrigem, lonOrigem;
    if (pedido.latitude_origem && pedido.longitude_origem) {
      latOrigem = pedido.latitude_origem;
      lonOrigem = pedido.longitude_origem;
    } else {
      try {
        const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Dado o endereço "${pedido.endereco_origem}", retorne a latitude e longitude aproximadas.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            }
          }
        });
        latOrigem = resultado.latitude;
        lonOrigem = resultado.longitude;
        
        // Salvar coordenadas no pedido
        await base44.asServiceRole.entities.Pedido.update(pedido.id, {
          latitude_origem: latOrigem,
          longitude_origem: lonOrigem
        });
      } catch (error) {
        return Response.json({ 
          error: 'Não foi possível obter coordenadas do pedido' 
        }, { status: 400 });
      }
    }
    
    // Buscar todos os motoristas
    const motoristas = await base44.asServiceRole.entities.Motorista.list();
    
    // Buscar dados de usuário de cada motorista (para avaliações e boost)
    const users = await base44.asServiceRole.entities.User.list();
    const pedidosTodos = await base44.asServiceRole.entities.Pedido.list();
    
    const motoristasComDados = motoristas.map(m => {
      const user = users.find(u => u.motorista_id === m.id);
      const pedidosMotorista = pedidosTodos.filter(p => p.motorista_id === m.id);
      const entregasConcluidas = pedidosMotorista.filter(p => p.status === 'concluido').length;
      
      return {
        ...m,
        avaliacao_media_motorista: user?.avaliacao_media_motorista || 0,
        boost_nivel: user?.boost_nivel || 0,
        boost_automatico: user?.boost_automatico || 0,
        boost_manual: user?.boost_manual || 0,
        total_entregas: pedidosMotorista.length,
        entregas_concluidas: entregasConcluidas,
        disponibilidade_horario: user?.disponibilidade_horario
      };
    });
    
    // Filtrar motoristas disponíveis com localização
    const motoristasDisponiveis = motoristasComDados.filter(m => 
      m.localizacao_atual?.latitude && 
      m.localizacao_atual?.longitude &&
      m.status !== 'inativo'
    );
    
    if (motoristasDisponiveis.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Nenhum motorista disponível no momento' 
      });
    }
    
    // Calcular scores
    const motoristasComScore = motoristasDisponiveis.map(motorista => {
      const distancia = calcularDistancia(
        latOrigem, lonOrigem,
        motorista.localizacao_atual.latitude,
        motorista.localizacao_atual.longitude
      );
      
      const disponivel = verificarDisponibilidade(motorista, pedido.data_agendada);
      const veiculoCompativel = verificarVeiculo(pedido, motorista);
      
      const score = calcularScore(motorista, pedido, distancia);
      
      return {
        motorista,
        distancia,
        score,
        disponivel,
        veiculoCompativel
      };
    });
    
    // Filtrar e ordenar por score
    const candidatos = motoristasComScore
      .filter(m => m.disponivel && m.veiculoCompativel)
      .sort((a, b) => b.score - a.score);
    
    if (candidatos.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'Nenhum motorista compatível encontrado' 
      });
    }
    
    // Selecionar melhor motorista
    const melhorCandidato = candidatos[0];
    
    // Atualizar pedido com sugestão
    await base44.asServiceRole.entities.Pedido.update(pedido.id, {
      motorista_sugerido_id: melhorCandidato.motorista.id,
      status_alocacao: 'sugerido'
    });
    
    // Criar notificação para o motorista
    const user = users.find(u => u.motorista_id === melhorCandidato.motorista.id);
    if (user) {
      const boostInfo = user.boost_nivel > 0 ? ` (Boost: ${user.boost_nivel})` : '';
      await base44.asServiceRole.entities.Notificacao.create({
        usuario_email: user.email,
        tipo: 'novo_pedido',
        titulo: '🎯 Novo Pedido Disponível!',
        descricao: `Pedido de ${pedido.tipo_servico} a ${melhorCandidato.distancia.toFixed(1)}km de você${boostInfo}. Valor: R$ ${pedido.valor_total?.toFixed(2) || '0.00'}`,
        pedido_id: pedido.id,
        icone: '🚗',
        cor: '#3b82f6'
      });
    }
    
    return Response.json({
      success: true,
      motorista_id: melhorCandidato.motorista.id,
      motorista_nome: melhorCandidato.motorista.nome,
      distancia: melhorCandidato.distancia.toFixed(1),
      score: melhorCandidato.score.toFixed(0),
      alternativas: candidatos.slice(1, 4).map(c => ({
        motorista_id: c.motorista.id,
        nome: c.motorista.nome,
        distancia: c.distancia.toFixed(1),
        score: c.score.toFixed(0)
      }))
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});