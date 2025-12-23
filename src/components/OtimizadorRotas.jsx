import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Loader2, CheckCircle2, MapPin, Navigation, X, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { servicoConfig } from '@/components/servicoConfig';
import MapaRota from '@/components/MapaRota';

export default function OtimizadorRotas({ pedidos, onClose }) {
  const [selecionados, setSelecionados] = useState([]);
  const [rotaOtimizada, setRotaOtimizada] = useState(null);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const queryClient = useQueryClient();

  // Obter localização atual do motorista
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocalizacaoAtual({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Não foi possível obter localização:', error);
        }
      );
    }
  }, []);

  const otimizarMutation = useMutation({
    mutationFn: async (pedidosIds) => {
      const pedidosSelecionados = pedidos.filter(p => pedidosIds.includes(p.id));
      
      // Preparar endereços
      const enderecos = pedidosSelecionados.map(p => ({
        id: p.id,
        origem: `${p.endereco_origem}, ${p.numero_origem || ''}`,
        destino: p.endereco_destino ? `${p.endereco_destino}, ${p.numero_destino || ''}` : null,
        cliente: p.nome_cliente,
        tipo_servico: p.tipo_servico
      }));

      // Chamar LLM para otimizar rota
      const prompt = `Você é um especialista em otimização de rotas de entregas.

Tenho ${enderecos.length} pedidos para entregar e preciso da rota mais eficiente considerando:
- Proximidade geográfica entre os pontos
- Fluxo de trânsito atual
- Minimização da distância total

Pedidos:
${enderecos.map((e, i) => `${i + 1}. Cliente: ${e.cliente}
   Coleta: ${e.origem}
   ${e.destino ? `Entrega: ${e.destino}` : 'Sem destino (serviço no local)'}
   Tipo: ${e.tipo_servico}`).join('\n\n')}

Por favor, retorne a ordem otimizada dos pedidos, considerando o trânsito atual e a proximidade.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ordem_otimizada: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pedido_id: { type: "string" },
                  ordem: { type: "number" },
                  razao: { type: "string" }
                }
              }
            },
            distancia_total_estimada: { type: "string" },
            tempo_total_estimado: { type: "string" },
            observacoes: { type: "string" }
          }
        }
      });

      return resultado;
    },
    onSuccess: (data) => {
      setRotaOtimizada(data);
      toast.success('Rota otimizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao otimizar rota');
    }
  });

  const iniciarRotaMutation = useMutation({
    mutationFn: async () => {
      if (!rotaOtimizada?.ordem_otimizada) return;

      // Atualizar todos os pedidos para "em_rota" com a ordem
      const updates = rotaOtimizada.ordem_otimizada.map(item => {
        return base44.entities.Pedido.update(item.pedido_id, {
          status: 'em_rota',
          ordem_rota: item.ordem
        });
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['meus-pedidos-motorista']);
      toast.success('Rota iniciada! Boa entrega! 🚗');
      onClose();
    },
    onError: () => {
      toast.error('Erro ao iniciar rota');
    }
  });

  const toggleSelecionado = (pedidoId) => {
    setSelecionados(prev => 
      prev.includes(pedidoId) 
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const handleOtimizar = () => {
    if (selecionados.length < 2) {
      toast.error('Selecione pelo menos 2 pedidos');
      return;
    }
    otimizarMutation.mutate(selecionados);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Route className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Otimizar Rota</h2>
              <p className="text-sm text-slate-500">
                Selecione os pedidos para criar uma rota eficiente
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!rotaOtimizada ? (
            <>
              <div className="space-y-3 mb-6">
                {pedidos.map(pedido => {
                  const servico = servicoConfig[pedido.tipo_servico];
                  const Icon = servico?.icon;
                  const isSelected = selecionados.includes(pedido.id);

                  return (
                    <motion.div
                      key={pedido.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                      onClick={() => toggleSelecionado(pedido.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelecionado(pedido.id)}
                          className="mt-1"
                        />
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${servico?.color}15` }}
                        >
                          {Icon && <Icon className="w-5 h-5" style={{ color: servico?.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800">{pedido.nome_cliente}</p>
                          <p className="text-xs text-slate-500 mb-2">{servico?.title}</p>
                          <div className="space-y-1">
                            <div className="flex items-start gap-2 text-xs">
                              <MapPin className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-600 truncate">{pedido.endereco_origem}</span>
                            </div>
                            {pedido.endereco_destino && (
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600 truncate">{pedido.endereco_destino}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleOtimizar}
                  disabled={selecionados.length < 2 || otimizarMutation.isPending}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
                >
                  {otimizarMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Otimizando...
                    </>
                  ) : (
                    <>
                      <Route className="w-4 h-4 mr-2" />
                      Otimizar Rota ({selecionados.length})
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-purple-600 mb-1">Distância Total</p>
                      <p className="text-lg font-bold text-purple-700">
                        {rotaOtimizada.distancia_total_estimada}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 mb-1">Tempo Estimado</p>
                      <p className="text-lg font-bold text-purple-700">
                        {rotaOtimizada.tempo_total_estimado}
                      </p>
                    </div>
                  </div>
                  {rotaOtimizada.observacoes && (
                    <p className="text-xs text-slate-600 mb-3">{rotaOtimizada.observacoes}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setMostrarMapa(!mostrarMapa)}
                    className="w-full rounded-lg"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    {mostrarMapa ? 'Ocultar Mapa' : 'Ver Mapa Interativo'}
                  </Button>
                </CardContent>
              </Card>

              {/* Mapa Interativo */}
              <AnimatePresence>
                {mostrarMapa && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <MapaRota
                      pedidosOrdenados={rotaOtimizada.ordem_otimizada.map(item => 
                        pedidos.find(p => p.id === item.pedido_id)
                      ).filter(Boolean)}
                      localizacaoAtual={localizacaoAtual}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ordem Otimizada */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-500" />
                  Ordem de Entrega Otimizada
                </h3>
                {rotaOtimizada.ordem_otimizada.map((item, index) => {
                  const pedido = pedidos.find(p => p.id === item.pedido_id);
                  if (!pedido) return null;
                  const servico = servicoConfig[pedido.tipo_servico];
                  const Icon = servico?.icon;

                  return (
                    <Card key={item.pedido_id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                            {item.ordem}
                          </div>
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${servico?.color}15` }}
                          >
                            {Icon && <Icon className="w-5 h-5" style={{ color: servico?.color }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800">{pedido.nome_cliente}</p>
                            <p className="text-xs text-slate-500 mb-2">{servico?.title}</p>
                            <p className="text-xs text-slate-600 mb-2">{item.razao}</p>
                            <div className="space-y-1">
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600">{pedido.endereco_origem}</span>
                              </div>
                              {pedido.endereco_destino && (
                                <div className="flex items-start gap-2 text-xs">
                                  <MapPin className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-600">{pedido.endereco_destino}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRotaOtimizada(null);
                    setSelecionados([]);
                  }}
                  className="rounded-xl"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => iniciarRotaMutation.mutate()}
                  disabled={iniciarRotaMutation.isPending}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
                >
                  {iniciarRotaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Iniciar Rota
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}