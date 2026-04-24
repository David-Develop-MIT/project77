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
      // Atualiza diretamente pelo motorista_id sem precisar listar todos
      await base44.entities.Motorista.update(user.motorista_id, {
        localizacao_atual: {
          latitude,
          longitude,
          ultima_atualizacao: new Date().toISOString()
        }
      });
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