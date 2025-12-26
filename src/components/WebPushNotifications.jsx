import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Função para solicitar permissão e registrar push
const requestNotificationPermission = async (userEmail) => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return null;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Função para mostrar notificação nativa
export const showNativeNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: '/logo.png',
    badge: '/badge.png',
    ...options
  });

  return notification;
};

export default function WebPushNotifications({ user, preferencias }) {
  const [permissao, setPermissao] = useState(Notification.permission);

  useEffect(() => {
    if (!user?.email) return;

    // Verificar se já tem permissão
    if (Notification.permission === 'granted') {
      setPermissao('granted');
    }
  }, [user]);

  // Função para ativar notificações push
  const ativarNotificacoesPush = async () => {
    const granted = await requestNotificationPermission(user?.email);
    
    if (granted) {
      setPermissao('granted');
      toast.success('Notificações ativadas!');
      
      // Salvar preferência
      const prefs = await base44.entities.PreferenciaNotificacao.list();
      const userPref = prefs.find(p => p.usuario_email === user.email);
      
      if (userPref) {
        await base44.entities.PreferenciaNotificacao.update(userPref.id, {
          push_subscription: { enabled: true, timestamp: new Date().toISOString() }
        });
      }
    } else {
      toast.error('Permissão negada para notificações');
    }
  };

  // Auto-solicitar se usuário tem preferência ativa mas sem permissão
  useEffect(() => {
    if (user?.email && preferencias && Notification.permission === 'default') {
      const temAlgumPushAtivo = preferencias.novos_pedidos_push || 
                                 preferencias.status_pedido_push || 
                                 preferencias.novas_mensagens_push ||
                                 preferencias.novas_ofertas_push ||
                                 preferencias.avaliacoes_push;
      
      if (temAlgumPushAtivo && !preferencias.push_subscription?.enabled) {
        // Aguardar um pouco antes de solicitar
        setTimeout(() => {
          ativarNotificacoesPush();
        }, 3000);
      }
    }
  }, [user, preferencias]);

  return null;
}

// Hook para enviar notificação push com ações
export const usePushNotification = (user, preferencias) => {
  const sendPushNotification = async (tipo, titulo, descricao, acoes = [], data = {}) => {
    if (!user?.email || !preferencias) return;

    // Verificar se o tipo de notificação está ativo
    const tipoMap = {
      novo_pedido: 'novos_pedidos_push',
      status_atualizado: 'status_pedido_push',
      mensagem: 'novas_mensagens_push',
      oferta: 'novas_ofertas_push',
      avaliacao: 'avaliacoes_push'
    };

    const prefKey = tipoMap[tipo];
    if (!prefKey || !preferencias[prefKey]) return;

    // Verificar permissão
    if (Notification.permission !== 'granted') return;

    // Criar notificação com ações
    const notification = showNativeNotification(titulo, {
      body: descricao,
      tag: `${tipo}-${data.id || Date.now()}`,
      requireInteraction: true,
      actions: acoes,
      data: data
    });

    if (notification) {
      // Adicionar listeners para cliques
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navegar para a página relevante
        if (data.url) {
          window.location.href = data.url;
        }
        
        notification.close();
      };
    }

    return notification;
  };

  return { sendPushNotification };
};