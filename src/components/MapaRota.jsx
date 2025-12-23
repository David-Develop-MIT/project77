import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones personalizados
const createNumberIcon = (number, color = '#8b5cf6') => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const startIcon = L.divIcon({
  html: '<div style="background-color: #10b981; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapaRota({ pedidosOrdenados, localizacaoAtual }) {
  const [coordenadas, setCoordenadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const geocodificar = async () => {
      setLoading(true);
      try {
        const resultados = [];
        
        // Adicionar localização atual se disponível
        if (localizacaoAtual) {
          resultados.push({
            tipo: 'atual',
            lat: localizacaoAtual.lat,
            lng: localizacaoAtual.lng,
            label: 'Sua localização'
          });
        }

        // Geocodificar endereços dos pedidos
        for (const [index, pedido] of pedidosOrdenados.entries()) {
          // Origem
          const origemCoords = await geocodificarEndereco(pedido.endereco_origem);
          if (origemCoords) {
            resultados.push({
              tipo: 'origem',
              ordem: index + 1,
              lat: origemCoords.lat,
              lng: origemCoords.lng,
              label: `#${index + 1} - Coleta: ${pedido.nome_cliente}`,
              endereco: pedido.endereco_origem,
              pedido
            });
          }

          // Destino (se houver)
          if (pedido.endereco_destino) {
            const destinoCoords = await geocodificarEndereco(pedido.endereco_destino);
            if (destinoCoords) {
              resultados.push({
                tipo: 'destino',
                ordem: index + 1,
                lat: destinoCoords.lat,
                lng: destinoCoords.lng,
                label: `#${index + 1} - Entrega: ${pedido.nome_cliente}`,
                endereco: pedido.endereco_destino,
                pedido
              });
            }
          }
        }

        setCoordenadas(resultados);
      } catch (error) {
        console.error('Erro ao geocodificar:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pedidosOrdenados?.length > 0) {
      geocodificar();
    }
  }, [pedidosOrdenados, localizacaoAtual]);

  const geocodificarEndereco = async (endereco) => {
    try {
      const prompt = `Dado o seguinte endereço brasileiro: "${endereco}"
      
Por favor, retorne as coordenadas geográficas (latitude e longitude) deste endereço.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            endereco_formatado: { type: "string" }
          }
        }
      });

      if (resultado.latitude && resultado.longitude) {
        return {
          lat: resultado.latitude,
          lng: resultado.longitude
        };
      }
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (coordenadas.length === 0) {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-xl flex items-center justify-center">
        <p className="text-slate-600">Nenhuma coordenada disponível</p>
      </div>
    );
  }

  // Calcular centro do mapa
  const center = coordenadas.length > 0 
    ? [coordenadas[0].lat, coordenadas[0].lng]
    : [-23.5505, -46.6333]; // São Paulo como padrão

  // Criar linha da rota
  const rotaLinhas = coordenadas
    .filter(c => c.tipo !== 'atual')
    .map(c => [c.lat, c.lng]);

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={12} />

        {/* Linha da rota */}
        {rotaLinhas.length > 1 && (
          <Polyline
            positions={rotaLinhas}
            pathOptions={{
              color: '#8b5cf6',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Marcadores */}
        {coordenadas.map((coord, index) => {
          const icon = coord.tipo === 'atual' 
            ? startIcon 
            : createNumberIcon(coord.ordem, coord.tipo === 'destino' ? '#f97316' : '#8b5cf6');

          return (
            <Marker
              key={index}
              position={[coord.lat, coord.lng]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold mb-1">{coord.label}</p>
                  <p className="text-xs text-slate-600">{coord.endereco}</p>
                  {coord.pedido && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        {coord.pedido.tipo_servico}
                      </p>
                      {coord.pedido.telefone_cliente && (
                        <p className="text-xs text-slate-500">
                          📞 {coord.pedido.telefone_cliente}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}