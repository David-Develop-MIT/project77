import { base44 } from '@/api/base44Client';

export async function calcularDistanciaEPreco(enderecoOrigem, enderecoDestino, tipoServico, precos) {
  try {
    // Busca preço da tabela
    const tabelaPreco = precos.find(p => p.tipo_servico === tipoServico && p.ativo);
    
    if (!tabelaPreco) {
      return { 
        erro: 'Preço não configurado para este serviço',
        distancia_km: null,
        tempo_estimado: null,
        valor_calculado: null
      };
    }

    // Se não tem destino, retorna apenas o valor mínimo
    if (!enderecoDestino || enderecoDestino.trim() === '') {
      return {
        distancia_km: 0,
        tempo_estimado: 'N/A',
        valor_calculado: tabelaPreco.valor_minimo,
        detalhes: 'Serviço sem destino - valor mínimo aplicado'
      };
    }

    // Chama LLM para calcular distância via Google Maps
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Calcule a distância e tempo estimado de viagem de carro entre os seguintes endereços no Brasil:

ORIGEM: ${enderecoOrigem}
DESTINO: ${enderecoDestino}

Use dados do Google Maps para fornecer a distância real de rota (não em linha reta) e o tempo estimado considerando trânsito médio.

IMPORTANTE: Retorne APENAS os dados solicitados no formato JSON.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          distancia_km: {
            type: "number",
            description: "Distância em quilômetros (número decimal)"
          },
          tempo_estimado: {
            type: "string",
            description: "Tempo estimado no formato 'X minutos' ou 'X horas'"
          }
        },
        required: ["distancia_km", "tempo_estimado"]
      }
    });

    const { distancia_km, tempo_estimado } = resultado;

    // Calcula o valor baseado na distância
    let valor_calculado;
    
    if (distancia_km <= tabelaPreco.km_inicial_incluido) {
      valor_calculado = tabelaPreco.valor_minimo;
    } else {
      const kmExcedente = distancia_km - tabelaPreco.km_inicial_incluido;
      valor_calculado = tabelaPreco.valor_minimo + (kmExcedente * tabelaPreco.valor_por_km);
    }

    return {
      distancia_km: Math.round(distancia_km * 10) / 10, // Arredonda para 1 casa decimal
      tempo_estimado,
      valor_calculado: Math.round(valor_calculado * 100) / 100, // Arredonda para 2 casas
      detalhes: `${distancia_km.toFixed(1)} km × R$ ${tabelaPreco.valor_por_km.toFixed(2)}/km`
    };

  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return {
      erro: 'Não foi possível calcular a distância',
      distancia_km: null,
      tempo_estimado: null,
      valor_calculado: null
    };
  }
}