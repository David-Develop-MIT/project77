import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CheckCheck, Trash2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notificacoes', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Notificacao.list('-created_date', 100);
      return todas.filter(n => n.usuario_email === user?.email);
    },
    enabled: !!user?.email && isOpen,
    refetchInterval: 30000
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.update(id, { lida: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificacoes']);
    }
  });

  const marcarTodasLidasMutation = useMutation({
    mutationFn: async () => {
      const naoLidas = notificacoes.filter(n => !n.lida);
      await Promise.all(naoLidas.map(n => base44.entities.Notificacao.update(n.id, { lida: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificacoes']);
      toast.success('Todas as notificações marcadas como lidas');
    }
  });

  const excluirMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificacoes']);
      toast.success('Notificação excluída');
    }
  });

  const handleClickNotificacao = (notificacao) => {
    if (!notificacao.lida) {
      marcarLidaMutation.mutate(notificacao.id);
    }
    
    if (notificacao.pedido_id) {
      navigate(`${createPageUrl('DetalhePedido')}?id=${notificacao.pedido_id}`);
      onClose();
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-50 lg:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="font-semibold text-slate-800">Notificações</h2>
              {naoLidas > 0 && (
                <p className="text-xs text-slate-500">{naoLidas} não {naoLidas === 1 ? 'lida' : 'lidas'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {naoLidas > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => marcarTodasLidasMutation.mutate()}
                disabled={marcarTodasLidasMutation.isPending}
                className="rounded-xl"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Notificações */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-slate-500">Carregando notificações...</p>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-slate-500">
                Você está em dia! Novas notificações aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {notificacoes.map((notificacao) => (
                <motion.div
                  key={notificacao.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card 
                    className={`border rounded-xl transition-all cursor-pointer hover:shadow-md ${
                      notificacao.lida 
                        ? 'border-slate-100 bg-white' 
                        : 'border-orange-200 bg-orange-50'
                    }`}
                    onClick={() => handleClickNotificacao(notificacao)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                          style={{ 
                            backgroundColor: notificacao.cor ? `${notificacao.cor}15` : '#f1f5f9',
                            color: notificacao.cor || '#64748b'
                          }}
                        >
                          {notificacao.icone || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold ${
                              notificacao.lida ? 'text-slate-700' : 'text-slate-900'
                            }`}>
                              {notificacao.titulo}
                            </h4>
                            {!notificacao.lida && (
                              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className={`text-xs mb-2 line-clamp-2 ${
                            notificacao.lida ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            {notificacao.descricao}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                              {format(new Date(notificacao.created_date), "dd MMM, HH:mm", { locale: ptBR })}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                excluirMutation.mutate(notificacao.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-slate-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}