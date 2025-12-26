import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, MapPin, Paperclip, Loader2, User, MessageCircle, History, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SugestoesInteligentes from '@/components/chat/SugestoesInteligentes';
import HistoricoChat from '@/components/chat/HistoricoChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function JanelaChat({ conversaId }) {
  const [mensagem, setMensagem] = useState('');
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const { data: conversa } = useQuery({
    queryKey: ['conversa', conversaId],
    queryFn: async () => {
      const conversas = await base44.entities.Conversa.list();
      return conversas.find(c => c.id === conversaId);
    },
    enabled: !!conversaId
  });

  const { data: pedido } = useQuery({
    queryKey: ['pedido', conversa?.pedido_id],
    queryFn: async () => {
      if (!conversa?.pedido_id) return null;
      const pedidos = await base44.entities.Pedido.list();
      return pedidos.find(p => p.id === conversa.pedido_id);
    },
    enabled: !!conversa?.pedido_id
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: async () => {
      const todas = await base44.entities.Mensagem.list('created_date', 1000);
      return todas.filter(m => m.conversa_id === conversaId);
    },
    enabled: !!conversaId,
    refetchInterval: 2000, // Polling mais rápido para tempo real
    staleTime: 0
  });

  // Marcar mensagens como lidas
  useEffect(() => {
    if (!mensagens.length || !user?.email) return;
    
    const naoLidas = mensagens.filter(m => 
      m.remetente_email !== user.email && 
      !m.lida_por?.includes(user.email)
    );

    naoLidas.forEach(m => {
      base44.entities.Mensagem.update(m.id, {
        lida_por: [...(m.lida_por || []), user.email]
      });
    });

    if (naoLidas.length > 0) {
      queryClient.invalidateQueries(['mensagens-nao-lidas']);
    }
  }, [mensagens, user?.email]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const enviarMutation = useMutation({
    mutationFn: async ({ tipo, conteudo, localizacao }) => {
      const msg = await base44.entities.Mensagem.create({
        conversa_id: conversaId,
        remetente_email: user.email,
        remetente_nome: user.name || user.email,
        tipo,
        conteudo,
        localizacao,
        lida_por: [user.email]
      });

      // Atualizar última mensagem da conversa
      await base44.entities.Conversa.update(conversaId, {
        ultima_mensagem: tipo === 'texto' ? conteudo.substring(0, 50) : tipo === 'imagem' ? '📷 Imagem' : '📍 Localização',
        ultima_mensagem_data: new Date().toISOString()
      });

      // Criar notificação para o outro participante
      const outroParticipante = conversa.participantes.find(p => p !== user.email);
      if (outroParticipante) {
        await base44.entities.Notificacao.create({
          usuario_email: outroParticipante,
          tipo: 'mensagem_sistema',
          titulo: `Nova mensagem de ${user.name || user.email}`,
          descricao: tipo === 'texto' ? conteudo.substring(0, 100) : tipo === 'imagem' ? '📷 Imagem' : '📍 Localização compartilhada',
          icone: '💬',
          cor: '#3b82f6'
        });
      }

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens', conversaId]);
      queryClient.invalidateQueries(['conversas']);
      queryClient.invalidateQueries(['notificacoes']);
      setMensagem('');
    }
  });

  const handleEnviar = () => {
    if (!mensagem.trim()) return;
    enviarMutation.mutate({ tipo: 'texto', conteudo: mensagem.trim() });
  };

  const handleEnviarImagem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnviandoImagem(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await enviarMutation.mutateAsync({ tipo: 'imagem', conteudo: file_url });
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setEnviandoImagem(false);
    }
  };

  const handleEnviarLocalizacao = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Obter endereço usando LLM
            const resultado = await base44.integrations.Core.InvokeLLM({
              prompt: `Dada a latitude ${latitude} e longitude ${longitude}, retorne o endereço aproximado desta localização no Brasil.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  endereco: { type: "string" }
                }
              }
            });

            await enviarMutation.mutateAsync({
              tipo: 'localizacao',
              conteudo: `https://www.google.com/maps?q=${latitude},${longitude}`,
              localizacao: {
                latitude,
                longitude,
                endereco: resultado.endereco
              }
            });
            toast.success('Localização compartilhada!');
          } catch (error) {
            toast.error('Erro ao compartilhar localização');
          }
        },
        () => {
          toast.error('Não foi possível obter sua localização');
        }
      );
    } else {
      toast.error('Geolocalização não suportada');
    }
  };

  const getOutroParticipante = () => {
    const outroEmail = conversa?.participantes?.find(p => p !== user?.email);
    return conversa?.participantes_nomes?.[outroEmail] || outroEmail || 'Usuário';
  };

  if (!conversaId) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{getOutroParticipante()}</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs text-slate-500">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pedido && (
            <div className="text-right mr-2">
              <p className="text-xs text-slate-500">Pedido #{pedido.id?.slice(-6)}</p>
              <p className="text-xs font-medium text-slate-700">{pedido.tipo_servico}</p>
            </div>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <History className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Histórico da Conversa</DialogTitle>
              </DialogHeader>
              <HistoricoChat 
                conversaId={conversaId} 
                outroParticipante={getOutroParticipante()} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1 p-4 bg-slate-50" ref={scrollRef}>
        <div className="space-y-4">
          {mensagens.map((msg, index) => {
            const isMinha = msg.remetente_email === user?.email;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${isMinha ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isMinha ? 'order-2' : 'order-1'}`}>
                  {!isMinha && (
                    <p className="text-xs text-slate-500 mb-1 px-3">
                      {msg.remetente_nome}
                    </p>
                  )}
                  <Card className={`${
                    isMinha 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white border-slate-200'
                  }`}>
                    <CardContent className="p-3">
                      {msg.tipo === 'texto' && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.conteudo}
                        </p>
                      )}
                      {msg.tipo === 'imagem' && (
                        <div className="space-y-1">
                          <img 
                            src={msg.conteudo} 
                            alt="Imagem" 
                            className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.conteudo, '_blank')}
                          />
                        </div>
                      )}
                      {msg.tipo === 'localizacao' && (
                        <a 
                          href={msg.conteudo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:underline"
                        >
                          <MapPin className="w-4 h-4" />
                          <div>
                            <p className="font-medium">📍 Localização</p>
                            <p className="text-xs opacity-80">
                              {msg.localizacao?.endereco || 'Ver no mapa'}
                            </p>
                          </div>
                        </a>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          isMinha ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          {format(new Date(msg.created_date), 'HH:mm', { locale: ptBR })}
                        </p>
                        {isMinha && (
                          <p className={`text-xs ${
                            msg.lida_por?.length > 1 ? 'text-blue-100' : 'text-blue-200'
                          }`}>
                            {msg.lida_por?.length > 1 ? '✓✓' : '✓'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <SugestoesInteligentes
          pedido={pedido}
          modoAtivo={user?.modo_ativo}
          onSelectSugestao={(texto) => setMensagem(texto)}
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleEnviarImagem}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoImagem}
            className="rounded-xl"
          >
            {enviandoImagem ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEnviarLocalizacao}
            className="rounded-xl"
          >
            <MapPin className="w-5 h-5" />
          </Button>
          <Input
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
            placeholder="Digite sua mensagem..."
            className="rounded-xl"
            disabled={enviarMutation.isPending}
          />
          <Button
            onClick={handleEnviar}
            disabled={!mensagem.trim() || enviarMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
          >
            {enviarMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}