import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import NotificationSound from '@/components/NotificationSound';
import WebPushNotifications, { showNativeNotification } from '@/components/WebPushNotifications';

const criarNotificacao = async (data) => {
  try {
    await base44.entities.Notificacao.create(data);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
};

export function useNotifications() {
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const usuarios = await base44.entities.UsuarioPickup.list();
      return usuarios.find(u => u.email === authUser.email);
    },
    enabled: !!authUser?.email,
    retry: false
  });

  const [playSound, setPlaySound] = useState(false);
  const previousPedidosRef = useRef(null);
  const previousMeusPedidosRef = useRef(null);
  const notifiedPedidosRef = useRef(new Set());

  const modoAtivo = user?.modo_ativo || 'cliente';
  const isMotorista = modoAtivo === 'motorista';
  const isCliente = modoAtivo === 'cliente';

  // Buscar preferências de notificação do usuário
  const { data: preferencias } = useQuery({
    queryKey: ['preferencias-notificacao', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const todas = await base44.entities.PreferenciaNotificacao.list();
      let pref = todas.find(p => p.usuario_email === user.email);
      
      if (!pref) {
        pref = await base44.entities.PreferenciaNotificacao.create({
          usuario_email: user.email,
          novos_pedidos: true,
          novos_pedidos_push: true,
          status_pedido: true,
          status_pedido_push: true,
          novas_mensagens: true,
          novas_mensagens_push: false,
          novas_ofertas: true,
          novas_ofertas_push: true,
          avaliacoes: true,
          avaliacoes_push: false,
          som_notificacao: true
        });
      }
      
      return pref;
    },
    enabled: !!user?.email
  });

  const triggerSound = () => {
    if (preferencias?.som_notificacao !== false) {
      setPlaySound(true);
      setTimeout(() => setPlaySound(false), 100);
    }
  };

  const sendPushNotification = (titulo, descricao, acoes = [], url = null) => {
    if (Notification.permission === 'granted') {
      const notification = showNativeNotification(titulo, {
        body: descricao,
        requireInteraction: false,
        actions: acoes,
        data: { url }
      });

      if (notification && url) {
        notification.onclick = () => {
          window.focus();
          window.location.href = url;
          notification.close();
        };
      }
    }
  };

  // Buscar notificações não lidas - TEMPO REAL
  const { data: notificacoesNaoLidas = [] } = useQuery({
    queryKey: ['notificacoes-nao-lidas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Notificacao.list('-created_date', 100);
      return todas.filter(n => n.usuario_email === user?.email && !n.lida);
    },
    enabled: !!user?.email,
    refetchInterval: 3000, // Poll a cada 3 segundos
    refetchOnWindowFocus: true
  });

  // Monitorar novas mensagens de chat - TEMPO REAL
  const { data: mensagensNaoLidas = [] } = useQuery({
    queryKey: ['mensagens-chat-nao-lidas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Mensagem.list('-created_date', 200);
      return todas.filter(m => 
        m.remetente_email !== user?.email && 
        !m.lida_por?.includes(user?.email)
      );
    },
    enabled: !!user?.email,
    refetchInterval: 3000, // Poll a cada 3 segundos
    refetchOnWindowFocus: true
  });

  // Notificar sobre novas mensagens
  const previousMensagensRef = useRef(null);
  useEffect(() => {
    if (!user?.email || !mensagensNaoLidas || mensagensNaoLidas.length === 0) return;

    if (previousMensagensRef.current === null) {
      previousMensagensRef.current = mensagensNaoLidas.map(m => m.id);
      return;
    }

    const previousIds = new Set(previousMensagensRef.current);
    const novasMensagens = mensagensNaoLidas.filter(m => !previousIds.has(m.id));

    if (novasMensagens.length > 0 && preferencias?.novas_mensagens) {
      triggerSound();
      novasMensagens.forEach(mensagem => {
        toast.success(
          `💬 Nova mensagem de ${mensagem.remetente_nome}`,
          {
            description: mensagem.tipo === 'texto' 
              ? mensagem.conteudo.substring(0, 50) 
              : mensagem.tipo === 'imagem' ? '📷 Imagem' : '📍 Localização',
            duration: 6000
          }
        );

        // Push notification
        if (preferencias?.novas_mensagens_push) {
          sendPushNotification(
            `💬 ${mensagem.remetente_nome}`,
            mensagem.tipo === 'texto' ? mensagem.conteudo.substring(0, 100) : 'Nova mensagem',
            [],
            createPageUrl('Chat')
          );
        }

        criarNotificacao({
          usuario_email: user.email,
          tipo: 'mensagem_sistema',
          titulo: `Mensagem de ${mensagem.remetente_nome}`,
          descricao: mensagem.tipo === 'texto' ? mensagem.conteudo.substring(0, 100) : 'Nova mensagem',
          icone: '💬',
          cor: '#3b82f6'
        });
      });
    }

    previousMensagensRef.current = mensagensNaoLidas.map(m => m.id);
  }, [mensagensNaoLidas, user?.email]);

  // Monitorar pedidos disponíveis para motoristas - TEMPO REAL
  const { data: pedidosDisponiveis = [] } = useQuery({
    queryKey: ['pedidos-disponiveis-notif'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => p.status === 'pendente' || p.status === 'confirmado');
    },
    enabled: isMotorista && !!user,
    refetchInterval: 5000, // Poll a cada 5 segundos
    refetchOnWindowFocus: true
  });

  // Monitorar pedidos do cliente - TEMPO REAL
  const { data: meusPedidos = [] } = useQuery({
    queryKey: ['meus-pedidos-notif'],
    queryFn: async () => {
      const todos = await base44.entities.Pedido.list('-created_date', 50);
      return todos.filter(p => p.created_by === user.email);
    },
    enabled: isCliente && !!user,
    refetchInterval: 5000, // Poll a cada 5 segundos
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

    if (novosPedidos.length > 0 && preferencias?.novos_pedidos) {
      triggerSound();
      novosPedidos.forEach(pedido => {
        notifiedPedidosRef.current.add(pedido.id);
        
        toast.success(
          `🚗 Novo pedido disponível: ${pedido.tipo_servico}`,
          {
            description: `Cliente: ${pedido.nome_cliente} - ${pedido.endereco_origem}`,
            duration: 8000
          }
        );

        // Push notification com ação rápida
        if (preferencias?.novos_pedidos_push) {
          sendPushNotification(
            '🚗 Novo Pedido Disponível',
            `${pedido.tipo_servico} - ${pedido.nome_cliente}`,
            [],
            createPageUrl('PedidosDisponiveis')
          );
        }

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
  }, [pedidosDisponiveis, isMotorista, user]);

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
      
      if (previousStatus && previousStatus !== pedido.status && preferencias?.status_pedido) {
        triggerSound();
        
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
              duration: 6000
            }
          );

          // Push notification
          if (preferencias?.status_pedido_push) {
            sendPushNotification(
              `${statusInfo.emoji} ${statusInfo.text}`,
              `Seu pedido de ${pedido.tipo_servico}`,
              [],
              `${createPageUrl('DetalhePedido')}?id=${pedido.id}`
            );
          }

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

  // Monitorar novas ofertas recebidas - TEMPO REAL
  const { data: ofertas = [] } = useQuery({
    queryKey: ['ofertas-recebidas', user?.email],
    queryFn: async () => {
      if (!user?.email || !isCliente) return [];
      const pedidos = await base44.entities.Pedido.list();
      const meusPedidos = pedidos.filter(p => p.created_by === user.email);
      const todasOfertas = await base44.entities.Oferta.list('-created_date', 100);
      return todasOfertas.filter(o => 
        meusPedidos.some(p => p.id === o.pedido_id) && 
        o.status === 'pendente'
      );
    },
    enabled: !!user?.email && isCliente,
    refetchInterval: 5000
  });

  const ofertasAnteriorRef = useRef([]);
  useEffect(() => {
    if (!ofertas || ofertas.length === 0) return;

    const novasOfertas = ofertas.filter(o => 
      !ofertasAnteriorRef.current.some(prevO => prevO.id === o.id)
    );

    if (novasOfertas.length > 0 && ofertasAnteriorRef.current.length > 0 && preferencias?.novas_ofertas) {
      triggerSound();
      novasOfertas.forEach(oferta => {
        toast.success(`💰 Nova oferta de ${oferta.motorista_nome}!`, {
          description: `Valor: R$ ${oferta.valor_proposto.toFixed(2)}`,
          duration: 5000
        });

        // Push notification com ação rápida
        if (preferencias?.novas_ofertas_push) {
          sendPushNotification(
            '💰 Nova Oferta Recebida',
            `${oferta.motorista_nome} - R$ ${oferta.valor_proposto.toFixed(2)}`,
            [],
            `${createPageUrl('DetalhePedido')}?id=${oferta.pedido_id}`
          );
        }

        criarNotificacao({
          usuario_email: user.email,
          tipo: 'novo_pedido',
          titulo: 'Nova Oferta Recebida',
          descricao: `${oferta.motorista_nome} fez uma oferta de R$ ${oferta.valor_proposto.toFixed(2)} para seu pedido`,
          pedido_id: oferta.pedido_id,
          icone: '💰',
          cor: '#f59e0b'
        });
      });
    }

    ofertasAnteriorRef.current = ofertas;
  }, [ofertas, user]);

  // Monitorar avaliações recebidas - TEMPO REAL
  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['avaliacoes-recebidas', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const todas = await base44.entities.Avaliacao.list('-created_date', 50);
      return todas.filter(a => a.avaliado_email === user.email);
    },
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const avaliacoesAnteriorRef = useRef([]);
  useEffect(() => {
    if (!avaliacoes || avaliacoes.length === 0) return;

    const novasAvaliacoes = avaliacoes.filter(a => 
      !avaliacoesAnteriorRef.current.some(prevA => prevA.id === a.id)
    );

    if (novasAvaliacoes.length > 0 && avaliacoesAnteriorRef.current.length > 0 && preferencias?.avaliacoes) {
      triggerSound();
      novasAvaliacoes.forEach(avaliacao => {
        const estrelas = '⭐'.repeat(avaliacao.nota);
        toast.success('⭐ Nova Avaliação Recebida!', {
          description: `${estrelas} ${avaliacao.nota}/5`,
          duration: 5000
        });

        // Push notification
        if (preferencias?.avaliacoes_push) {
          sendPushNotification(
            '⭐ Nova Avaliação',
            `Você recebeu ${avaliacao.nota} estrelas`,
            [],
            null
          );
        }

        criarNotificacao({
          usuario_email: user.email,
          tipo: 'avaliacao_recebida',
          titulo: 'Nova Avaliação',
          descricao: `Você recebeu ${avaliacao.nota} estrelas${avaliacao.comentario ? `: "${avaliacao.comentario}"` : ''}`,
          pedido_id: avaliacao.pedido_id,
          icone: '⭐',
          cor: '#eab308'
        });
      });
    }

    avaliacoesAnteriorRef.current = avaliacoes;
  }, [avaliacoes, user]);

  return {
    pedidosDisponiveis: isMotorista ? pedidosDisponiveis : [],
    meusPedidos: isCliente ? meusPedidos : [],
    notificacoesNaoLidas,
    totalNaoLidas: notificacoesNaoLidas.length,
    hasNewNotifications: notificacoesNaoLidas.length > 0,
    preferencias,
    NotificationSound: () => <NotificationSound play={playSound} />,
    WebPushComponent: () => <WebPushNotifications user={user} preferencias={preferencias} />
  };
}