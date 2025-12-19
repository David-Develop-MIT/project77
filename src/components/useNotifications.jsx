import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useNotifications() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const previousPedidosRef = useRef(null);
  const notifiedPedidosRef = useRef(new Set());

  const modoAtivo = user?.modo_ativo || 'cliente';
  const isMotorista = modoAtivo === 'motorista';
  const isCliente = modoAtivo === 'cliente';

  // Monitorar pedidos para motoristas (novos pedidos disponíveis)
  const { data: pedidosDisponiveis = [] } = useQuery({
    queryKey: ['pedidos-disponiveis-notif'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => p.status === 'pendente' || p.status === 'confirmado');
    },
    enabled: isMotorista && !!user,
    refetchInterval: 15000, // Poll a cada 15 segundos
    refetchOnWindowFocus: true
  });

  // Monitorar pedidos do cliente (atualizações de status)
  const { data: meusPedidos = [] } = useQuery({
    queryKey: ['meus-pedidos-notif'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => p.created_by === user.email);
    },
    enabled: isCliente && !!user,
    refetchInterval: 20000, // Poll a cada 20 segundos
    refetchOnWindowFocus: true
  });

  // Notificações para motoristas - novos pedidos disponíveis
  useEffect(() => {
    if (!isMotorista || !pedidosDisponiveis || pedidosDisponiveis.length === 0) return;

    if (previousPedidosRef.current === null) {
      previousPedidosRef.current = pedidosDisponiveis.map(p => p.id);
      return;
    }

    const previousIds = new Set(previousPedidosRef.current);
    const novosPedidos = pedidosDisponiveis.filter(p => 
      !previousIds.has(p.id) && !notifiedPedidosRef.current.has(p.id)
    );

    if (novosPedidos.length > 0) {
      novosPedidos.forEach(pedido => {
        notifiedPedidosRef.current.add(pedido.id);
        
        toast.success(
          `🚗 Novo pedido disponível: ${pedido.tipo_servico}`,
          {
            description: `Cliente: ${pedido.nome_cliente} - ${pedido.endereco_origem}`,
            duration: 8000,
            action: {
              label: 'Ver',
              onClick: () => window.location.href = '/PedidosDisponiveis'
            }
          }
        );
      });

      // Tocar som de notificação se disponível
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBVio5O+qWRQKXLbs0ppFCB';
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    }

    previousPedidosRef.current = pedidosDisponiveis.map(p => p.id);
  }, [pedidosDisponiveis, isMotorista]);

  // Notificações para clientes - mudanças de status
  useEffect(() => {
    if (!isCliente || !meusPedidos || meusPedidos.length === 0) return;

    if (previousPedidosRef.current === null) {
      previousPedidosRef.current = meusPedidos.map(p => ({ id: p.id, status: p.status }));
      return;
    }

    const previousMap = new Map(previousPedidosRef.current.map(p => [p.id, p.status]));
    
    meusPedidos.forEach(pedido => {
      const previousStatus = previousMap.get(pedido.id);
      
      if (previousStatus && previousStatus !== pedido.status) {
        const statusMessages = {
          confirmado: { emoji: '✅', text: 'Pedido confirmado', color: 'blue' },
          em_andamento: { emoji: '🚀', text: 'Pedido em andamento', color: 'purple' },
          em_rota: { emoji: '🗺️', text: 'Motorista a caminho', color: 'purple' },
          concluido: { emoji: '🎉', text: 'Pedido concluído', color: 'green' },
          cancelado: { emoji: '❌', text: 'Pedido cancelado', color: 'red' }
        };

        const statusInfo = statusMessages[pedido.status];
        if (statusInfo) {
          toast.success(
            `${statusInfo.emoji} ${statusInfo.text}`,
            {
              description: `Pedido: ${pedido.tipo_servico} - ${pedido.nome_cliente}`,
              duration: 6000,
              action: {
                label: 'Ver Detalhes',
                onClick: () => window.location.href = `/DetalhePedido?id=${pedido.id}`
              }
            }
          );
        }
      }
    });

    previousPedidosRef.current = meusPedidos.map(p => ({ id: p.id, status: p.status }));
  }, [meusPedidos, isCliente]);

  return {
    pedidosDisponiveis: isMotorista ? pedidosDisponiveis : [],
    meusPedidos: isCliente ? meusPedidos : [],
    hasNewNotifications: isMotorista ? pedidosDisponiveis.length > 0 : false
  };
}