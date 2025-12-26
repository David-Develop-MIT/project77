import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Bell, Volume2, VolumeX, Smartphone, Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ConfiguracoesNotificacoes() {
  const queryClient = useQueryClient();

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

  const { data: preferencias, isLoading } = useQuery({
    queryKey: ['preferencias-notificacao', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.PreferenciaNotificacao.list();
      let pref = todas.find(p => p.usuario_email === user.email);
      
      // Criar preferências padrão se não existir
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

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.PreferenciaNotificacao.update(preferencias.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['preferencias-notificacao']);
      toast.success('Preferências atualizadas!');
    }
  });

  const handleToggle = (campo, valor) => {
    updateMutation.mutate({ [campo]: valor });
  };

  const solicitarPermissaoPush = async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações');
      return;
    }

    if (Notification.permission === 'granted') {
      toast.success('Notificações já estão ativadas!');
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notificações ativadas com sucesso!');
      handleToggle('push_subscription', { 
        enabled: true, 
        timestamp: new Date().toISOString() 
      });
    } else {
      toast.error('Permissão negada. Ative nas configurações do navegador.');
    }
  };

  const testarNotificacao = () => {
    if (Notification.permission !== 'granted') {
      toast.error('Ative as notificações primeiro');
      return;
    }

    new Notification('🚗 Pickup Brasil', {
      body: 'Esta é uma notificação de teste!',
      icon: '/logo.png',
      badge: '/badge.png'
    });

    toast.success('Notificação de teste enviada!');
  };

  const notificacoesConfig = [
    {
      id: 'novos_pedidos',
      titulo: 'Novos Pedidos Disponíveis',
      descricao: 'Quando novos pedidos estão disponíveis para você',
      icon: '🚗',
      campoInApp: 'novos_pedidos',
      campoPush: 'novos_pedidos_push',
      modoMotorista: true
    },
    {
      id: 'status_pedido',
      titulo: 'Atualizações de Status',
      descricao: 'Mudanças no status dos seus pedidos',
      icon: '📦',
      campoInApp: 'status_pedido',
      campoPush: 'status_pedido_push',
      modoCliente: true
    },
    {
      id: 'novas_mensagens',
      titulo: 'Novas Mensagens',
      descricao: 'Mensagens recebidas no chat',
      icon: '💬',
      campoInApp: 'novas_mensagens',
      campoPush: 'novas_mensagens_push',
      todos: true
    },
    {
      id: 'novas_ofertas',
      titulo: 'Novas Ofertas',
      descricao: 'Quando motoristas fazem ofertas nos seus pedidos',
      icon: '💰',
      campoInApp: 'novas_ofertas',
      campoPush: 'novas_ofertas_push',
      modoCliente: true
    },
    {
      id: 'avaliacoes',
      titulo: 'Avaliações Recebidas',
      descricao: 'Quando você recebe uma avaliação',
      icon: '⭐',
      campoInApp: 'avaliacoes',
      campoPush: 'avaliacoes_push',
      todos: true
    }
  ];

  const modoAtivo = user?.modo_ativo || 'cliente';

  if (isLoading || !preferencias) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  const permissaoPush = typeof Notification !== 'undefined' ? Notification.permission : 'default';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Notificações</h1>
              <p className="text-slate-500">Configure suas preferências de notificação</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Status de Permissão Push */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Notificações Push do Navegador
              </CardTitle>
              <CardDescription>
                Receba notificações mesmo quando o app não estiver aberto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  {permissaoPush === 'granted' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Ativadas</p>
                        <p className="text-sm text-slate-500">Notificações push funcionando</p>
                      </div>
                    </>
                  ) : permissaoPush === 'denied' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Bloqueadas</p>
                        <p className="text-sm text-slate-500">Ative nas configurações do navegador</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Não Ativadas</p>
                        <p className="text-sm text-slate-500">Clique para ativar</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {permissaoPush === 'granted' && (
                    <Button
                      onClick={testarNotificacao}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      Testar
                    </Button>
                  )}
                  {permissaoPush === 'default' && (
                    <Button
                      onClick={solicitarPermissaoPush}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Ativar Agora
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferências por Tipo */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-600" />
                Tipos de Notificação
              </CardTitle>
              <CardDescription>
                Configure onde você quer receber cada tipo de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificacoesConfig
                .filter(item => 
                  item.todos || 
                  (item.modoCliente && modoAtivo === 'cliente') ||
                  (item.modoMotorista && modoAtivo === 'motorista')
                )
                .map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{item.titulo}</h4>
                        <p className="text-sm text-slate-500">{item.descricao}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 ml-11">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-700 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          Notificação no App
                        </Label>
                        <Switch
                          checked={preferencias[item.campoInApp] ?? true}
                          onCheckedChange={(checked) => handleToggle(item.campoInApp, checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-700 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          Notificação Push
                        </Label>
                        <Switch
                          checked={preferencias[item.campoPush] ?? false}
                          onCheckedChange={(checked) => handleToggle(item.campoPush, checked)}
                          disabled={permissaoPush !== 'granted'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Outras Configurações */}
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {preferencias.som_notificacao ? (
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                Som de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Tocar som ao receber notificações</p>
                  <p className="text-xs text-slate-500 mt-1">Alerta sonoro para notificações no app</p>
                </div>
                <Switch
                  checked={preferencias.som_notificacao ?? true}
                  onCheckedChange={(checked) => handleToggle('som_notificacao', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}