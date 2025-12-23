import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageCircle, User, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ListaConversas({ onSelectConversa, conversaSelecionada }) {
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

  const { data: conversas = [] } = useQuery({
    queryKey: ['conversas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Conversa.list('-ultima_mensagem_data', 100);
      return todas.filter(c => c.participantes?.includes(user?.email) && c.ativa);
    },
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens-nao-lidas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Mensagem.list('-created_date', 500);
      return todas.filter(m => 
        m.remetente_email !== user?.email && 
        !m.lida_por?.includes(user?.email)
      );
    },
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const getMensagensNaoLidas = (conversaId) => {
    return mensagens.filter(m => m.conversa_id === conversaId).length;
  };

  const getOutroParticipante = (conversa) => {
    const outroEmail = conversa.participantes?.find(p => p !== user?.email);
    return conversa.participantes_nomes?.[outroEmail] || outroEmail || 'Usuário';
  };

  if (conversas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-800 mb-2">Nenhuma conversa</h3>
        <p className="text-sm text-slate-500">
          Suas conversas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {conversas.map((conversa, index) => {
          const naoLidas = getMensagensNaoLidas(conversa.id);
          const isSelected = conversaSelecionada === conversa.id;

          return (
            <motion.div
              key={conversa.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => onSelectConversa(conversa.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-800 truncate">
                          {getOutroParticipante(conversa)}
                        </h4>
                        {naoLidas > 0 && (
                          <Badge className="bg-red-500 text-white ml-2">
                            {naoLidas}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-1">
                        {conversa.ultima_mensagem || 'Nenhuma mensagem ainda'}
                      </p>
                      {conversa.ultima_mensagem_data && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(conversa.ultima_mensagem_data), "dd MMM, HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}