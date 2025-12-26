import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Route, MapPin, Navigation, Map as MapIcon, Clock, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MapaRota from '@/components/MapaRota';
import { servicoConfig } from '@/components/servicoConfig';

export default function RotasDia() {
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [localizacaoAtual, setLocalizacaoAtual] = useState(null);

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const usuarios = await base44.entities.UsuarioPickup.list();
      return usuarios.find(u => u.email === authUser.email);
    },
    enabled: !!authUser?.email
  });

  // Buscar pedidos do motorista que estão em rota
  const { data: pedidosEmRota = [], isLoading } = useQuery({
    queryKey: ['pedidos-em-rota', user?.motorista_id],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-ordem_rota', 100);
      return todos.filter(p => 
        p.motorista_id === user?.motorista_id && 
        p.status === 'em_rota' &&
        p.ordem_rota !== null
      ).sort((a, b) => a.ordem_rota - b.ordem_rota);
    },
    enabled: !!user?.motorista_id,
    refetchInterval: 10000
  });

  // Obter localização atual
  React.useEffect(() => {
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

  const abrirNoGPS = () => {
    if (pedidosEmRota.length === 0) {
      toast.error('Nenhuma rota ativa');
      return;
    }

    const waypoints = pedidosEmRota.map((p) => {
      const origem = `${p.latitude_origem},${p.longitude_origem}`;
      if (p.endereco_destino && p.latitude_destino) {
        return `${origem}/${p.latitude_destino},${p.longitude_destino}`;
      }
      return origem;
    }).join('/');
    
    const googleMapsUrl = `https://www.google.com/maps/dir/${localizacaoAtual ? `${localizacaoAtual.lat},${localizacaoAtual.lng}/` : ''}${waypoints}`;
    window.open(googleMapsUrl, '_blank');
    toast.success('Abrindo no GPS...');
  };

  const abrirNoWaze = () => {
    if (pedidosEmRota.length === 0 || !pedidosEmRota[0]) {
      toast.error('Nenhuma rota ativa');
      return;
    }

    // Waze só suporta uma parada por vez, então enviamos a próxima parada
    const proximoDestino = pedidosEmRota[0];
    const lat = proximoDestino.latitude_origem;
    const lng = proximoDestino.longitude_origem;
    
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
    toast.success('Abrindo no Waze...');
  };

  const totalParadas = pedidosEmRota.reduce((acc, p) => {
    return acc + 1 + (p.endereco_destino ? 1 : 0);
  }, 0);

  if (!user?.motorista_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="max-w-md border-slate-100 rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Route className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">
              Perfil de motorista necessário
            </h3>
            <p className="text-slate-500">
              Esta funcionalidade está disponível apenas para motoristas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Rota do Dia</h1>
              <p className="text-slate-500 mt-1">
                {pedidosEmRota.length} {pedidosEmRota.length === 1 ? 'pedido' : 'pedidos'} em rota • {totalParadas} paradas
              </p>
            </div>
            {pedidosEmRota.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={abrirNoGPS}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Google Maps
                </Button>
                <Button
                  onClick={abrirNoWaze}
                  variant="outline"
                  className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Waze
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <Card className="border-slate-100 rounded-2xl animate-pulse">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4" />
              <div className="h-4 bg-slate-100 rounded w-32 mx-auto" />
            </CardContent>
          </Card>
        ) : pedidosEmRota.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Nenhuma rota ativa
              </h3>
              <p className="text-slate-500">
                Use o otimizador de rotas para criar uma nova rota
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resumo da Rota */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-purple-600" />
                  Resumo da Rota
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Pedidos</p>
                  <p className="text-2xl font-bold text-purple-700">{pedidosEmRota.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Paradas</p>
                  <p className="text-2xl font-bold text-purple-700">{totalParadas}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pedidosEmRota.filter(p => p.status === 'concluido').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Restantes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pedidosEmRota.filter(p => p.status === 'em_rota').length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mapa Interativo */}
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-600" />
                    Visualização da Rota
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarMapa(!mostrarMapa)}
                    className="rounded-lg"
                  >
                    {mostrarMapa ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </CardHeader>
              {mostrarMapa && (
                <CardContent>
                  <MapaRota
                    pedidosOrdenados={pedidosEmRota}
                    localizacaoAtual={localizacaoAtual}
                  />
                </CardContent>
              )}
            </Card>

            {/* Lista de Paradas */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Sequência de Paradas
              </h2>
              {pedidosEmRota.map((pedido, index) => {
                const servico = servicoConfig[pedido.tipo_servico];
                const Icon = servico?.icon;

                return (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-slate-100 rounded-2xl hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                            {pedido.ordem_rota}
                          </div>
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${servico?.color}15` }}
                          >
                            {Icon && <Icon className="w-6 h-6" style={{ color: servico?.color }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-slate-800">{pedido.nome_cliente}</p>
                              {pedido.status === 'concluido' && (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Concluído
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mb-3">{servico?.title}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-500">Coleta</p>
                                  <p className="text-slate-700">{pedido.endereco_origem}</p>
                                </div>
                              </div>
                              {pedido.endereco_destino && (
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-slate-500">Entrega</p>
                                    <p className="text-slate-700">{pedido.endereco_destino}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}