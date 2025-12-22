import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const criarNotificacao = async (data) => {
  try {
    await base44.entities.Notificacao.create(data);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
};

export function useNotifications() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const previousPedidosRef = useRef(null);
  const previousMeusPedidosRef = useRef(null);
  const notifiedPedidosRef = useRef(new Set());

  const modoAtivo = user?.modo_ativo || 'cliente';
  const isMotorista = modoAtivo === 'motorista';
  const isCliente = modoAtivo === 'cliente';

  // Buscar notificações não lidas
  const { data: notificacoesNaoLidas = [] } = useQuery({
    queryKey: ['notificacoes-nao-lidas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Notificacao.list('-created_date', 50);
      return todas.filter(n => n.usuario_email === user?.email && !n.lida);
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  // Monitorar pedidos em andamento para motoristas
  const { data: meusPedidosMotorista = [] } = useQuery({
    queryKey: ['meus-pedidos-motorista-notif'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => 
        p.motorista_id === user?.motorista_id && 
        (p.status === 'em_andamento' || p.status === 'em_rota')
      );
    },
    enabled: isMotorista && !!user?.motorista_id,
    refetchInterval: 20000,
    refetchOnWindowFocus: true
  });

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

        // Criar notificação persistente
        criarNotificacao({
          usuario_email: user.email,
          tipo: 'novo_pedido',
          titulo: 'Novo pedido disponível',
          descricao: `${pedido.tipo_servico} - ${pedido.nome_cliente} em ${pedido.endereco_origem}`,
          pedido_id: pedido.id,
          icone: '🚗',
          cor: '#f97316'
        });
      });
    }

    previousPedidosRef.current = pedidosDisponiveis.map(p => p.id);
  }, [pedidosDisponiveis, isMotorista]);

  // Notificações para clientes - mudanças de status
  useEffect(() => {
    if (!isCliente || !meusPedidos || meusPedidos.length === 0) return;

    if (previousMeusPedidosRef.current === null) {
      previousMeusPedidosRef.current = meusPedidos.map(p => ({ id: p.id, status: p.status }));
      return;
    }

    const previousMap = new Map(previousMeusPedidosRef.current.map(p => [p.id, p.status]));
    
    meusPedidos.forEach(pedido => {
      const previousStatus = previousMap.get(pedido.id);
      
      if (previousStatus && previousStatus !== pedido.status) {
        const statusMessages = {
          confirmado: { emoji: '✅', text: 'Pedido confirmado', color: '#3b82f6' },
          em_andamento: { emoji: '🚀', text: 'Pedido em andamento', color: '#8b5cf6' },
          em_rota: { emoji: '🗺️', text: 'Motorista a caminho', color: '#8b5cf6' },
          concluido: { emoji: '🎉', text: 'Pedido concluído', color: '#10b981' },
          cancelado: { emoji: '❌', text: 'Pedido cancelado', color: '#ef4444' }
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

          // Criar notificação persistente
          criarNotificacao({
            usuario_email: user.email,
            tipo: 'status_atualizado',
            titulo: statusInfo.text,
            descricao: `Seu pedido de ${pedido.tipo_servico} foi atualizado`,
            pedido_id: pedido.id,
            icone: statusInfo.emoji,
            cor: statusInfo.color
          });
        }
      }
    });

    previousMeusPedidosRef.current = meusPedidos.map(p => ({ id: p.id, status: p.status }));
  }, [meusPedidos, isCliente, user]);

  return {
    pedidosDisponiveis: isMotorista ? pedidosDisponiveis : [],
    meusPedidos: isCliente ? meusPedidos : [],
    notificacoesNaoLidas,
    totalNaoLidas: notificacoesNaoLidas.length,
    hasNewNotifications: notificacoesNaoLidas.length > 0
  };
}