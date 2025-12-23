import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AtualizarLocalizacao() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ latitude, longitude }) => {
      if (!user?.motorista_id) return;
      
      const motoristas = await base44.entities.Motorista.list();
      const motorista = motoristas.find(m => m.id === user.motorista_id);
      
      if (motorista) {
        await base44.entities.Motorista.update(motorista.id, {
          localizacao_atual: {
            latitude,
            longitude,
            ultima_atualizacao: new Date().toISOString()
          }
        });
      }
    }
  });

  useEffect(() => {
    if (!user?.motorista_id) return;

    // Atualizar localização a cada 30 segundos
    const atualizarLocalizacao = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            atualizarMutation.mutate({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Erro ao obter localização:', error);
          }
        );
      }
    };

    // Atualizar imediatamente
    atualizarLocalizacao();

    // Configurar intervalo
    const intervalo = setInterval(atualizarLocalizacao, 30000);

    return () => clearInterval(intervalo);
  }, [user?.motorista_id]);

  return null; // Componente invisível
}