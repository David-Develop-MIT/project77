import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, MapPin, Truck } from 'lucide-react';

// Fix para ícones do Leaflet no build
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Ícones customizados
const origemIcon = L.divIcon({
  html: '<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinoIcon = L.divIcon({
  html: '<div style="background: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const motoristaIcon = L.divIcon({
  html: '<div style="background: #f97316; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(249,115,22,0.4); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;"><svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Componente para ajustar o mapa automaticamente
function MapBounds({ origem, destino, motorista }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);
    
    if (origem?.latitude && origem?.longitude) {
      bounds.extend([origem.latitude, origem.longitude]);
    }
    if (destino?.latitude && destino?.longitude) {
      bounds.extend([destino.latitude, destino.longitude]);
    }
    if (motorista?.latitude && motorista?.longitude) {
      bounds.extend([motorista.latitude, motorista.longitude]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, origem, destino, motorista]);

  return null;
}

export default function MapaRota({ origem, destino, motoristaId }) {
  const [rota, setRota] = useState([]);

  // Buscar localização do motorista em tempo real
  const { data: motorista } = useQuery({
    queryKey: ['motorista-localizacao', motoristaId],
    queryFn: async () => {
      if (!motoristaId) return null;
      const motoristas = await base44.entities.Motorista.list();
      const mot = motoristas.find(m => m.id === motoristaId);
      return mot?.localizacao_atual;
    },
    enabled: !!motoristaId,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Buscar rota entre origem e destino
  useEffect(() => {
    const buscarRota = async () => {
      if (!origem?.latitude || !origem?.longitude || !destino?.latitude || !destino?.longitude) {
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRota(coordinates);
        }
      } catch (error) {
        console.error('Erro ao buscar rota:', error);
      }
    };

    buscarRota();
  }, [origem, destino]);

  if (!origem?.latitude || !origem?.longitude) {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">Localização não disponível</p>
        </div>
      </div>
    );
  }

  const center = [origem.latitude, origem.longitude];

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-200 shadow-lg relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Rota traçada */}
        {rota.length > 0 && (
          <Polyline
            positions={rota}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
            dashOffset="0"
          />
        )}

        {/* Marcador de origem */}
        <Marker position={[origem.latitude, origem.longitude]} icon={origemIcon}>
          <Popup>
            <div className="p-2">
              <p className="font-semibold text-emerald-700">🟢 Origem</p>
              <p className="text-xs text-slate-600 mt-1">{origem.endereco || 'Ponto de partida'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Marcador de destino */}
        {destino?.latitude && destino?.longitude && (
          <Marker position={[destino.latitude, destino.longitude]} icon={destinoIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-red-700">📍 Destino</p>
                <p className="text-xs text-slate-600 mt-1">{destino.endereco || 'Ponto de chegada'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador do motorista em tempo real */}
        {motorista?.latitude && motorista?.longitude && (
          <Marker position={[motorista.latitude, motorista.longitude]} icon={motoristaIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-orange-700">🚗 Motorista</p>
                <p className="text-xs text-slate-600 mt-1">
                  Localização em tempo real
                </p>
                {motorista.ultima_atualizacao && (
                  <p className="text-xs text-slate-400 mt-1">
                    Atualizado: {new Date(motorista.ultima_atualizacao).toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ajustar limites do mapa automaticamente */}
        <MapBounds origem={origem} destino={destino} motorista={motorista} />
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-slate-200">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-slate-700">Origem</span>
          </div>
          {destino?.latitude && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-slate-700">Destino</span>
            </div>
          )}
          {motorista?.latitude && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-slate-700">Motorista</span>
            </div>
          )}
          {rota.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500 border-dashed" />
              <span className="text-slate-700">Rota</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}