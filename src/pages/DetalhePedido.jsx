import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, User, Phone, Calendar, Clock, FileText, 
  Edit2, Trash2, CheckCircle, XCircle, Truck, Loader2, Navigation, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StatusBadge from '@/components/StatusBadge';
import AvaliacaoModal from '@/components/AvaliacaoModal';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';
import { servicoConfig } from '@/components/servicoConfig';
import { toast } from 'sonner';

export default function DetalhePedido() {
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pedido, isLoading } = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: async () => {
      const pedidos = await base44.entities.Pedido.list();
      return pedidos.find(p => p.id === pedidoId);
    },
    enabled: !!pedidoId
  });

  const { data: minhaAvaliacao } = useQuery({
    queryKey: ['minha-avaliacao', pedidoId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const avaliacoes = await base44.entities.Avaliacao.list();
      return avaliacoes.find(a => a.pedido_id === pedidoId && a.avaliador_email === user.email);
    },
    enabled: !!pedidoId && !!user && pedido?.status === 'concluido'
  });

  const { data: avaliacaoRecebida } = useQuery({
    queryKey: ['avaliacao-recebida', pedidoId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const avaliacoes = await base44.entities.Avaliacao.list();
      return avaliacoes.find(a => a.pedido_id === pedidoId && a.avaliado_email === user.email);
    },
    enabled: !!pedidoId && !!user && pedido?.status === 'concluido'
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pedido.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pedido', pedidoId]);
      queryClient.invalidateQueries(['pedidos']);
      toast.success('Status atualizado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pedido.delete(id),
    onSuccess: () => {
      toast.success('Pedido excluído!');
      navigate(createPageUrl('MeusPedidos'));
    }
  });

  const handleStatusChange = async (newStatus) => {
    updateMutation.mutate({ id: pedidoId, data: { status: newStatus } });
    
    // Se marcar como concluído, calcular e atualizar médias de avaliação
    if (newStatus === 'concluido') {
      setTimeout(async () => {
        await atualizarMediasAvaliacao();
      }, 1000);
    }
  };

  const atualizarMediasAvaliacao = async () => {
    try {
      const avaliacoes = await base44.entities.Avaliacao.list();
      
      // Atualizar média do cliente
      const avaliacoesCliente = avaliacoes.filter(a => a.avaliado_email === pedido.created_by);
      if (avaliacoesCliente.length > 0) {
        const mediaCliente = avaliacoesCliente.reduce((acc, a) => acc + a.nota, 0) / avaliacoesCliente.length;
        await base44.entities.User.update(pedido.created_by, {
          avaliacao_media_cliente: mediaCliente,
          total_avaliacoes_cliente: avaliacoesCliente.length
        });
      }
      
      // Atualizar média do motorista se houver
      if (pedido.motorista_id) {
        const motoristas = await base44.entities.Motorista.list();
        const motorista = motoristas.find(m => m.id === pedido.motorista_id);
        if (motorista) {
          const avaliacoesMotorista = avaliacoes.filter(a => a.avaliado_email === motorista.created_by);
          if (avaliacoesMotorista.length > 0) {
            const mediaMotorista = avaliacoesMotorista.reduce((acc, a) => acc + a.nota, 0) / avaliacoesMotorista.length;
            await base44.entities.User.update(motorista.created_by, {
              avaliacao_media_motorista: mediaMotorista,
              total_avaliacoes_motorista: avaliacoesMotorista.length
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar médias:', error);
    }
  };

  const isCliente = user?.email === pedido?.created_by;
  const isMotorista = user?.motorista_id === pedido?.motorista_id;
  const podeAvaliar = pedido?.status === 'concluido' && !minhaAvaliacao;
  
  let avaliadoEmail = null;
  let avaliadoNome = null;
  let tipoAvaliador = null;
  
  if (isCliente && pedido?.motorista_nome) {
    avaliadoNome = pedido.motorista_nome;
    tipoAvaliador = 'cliente';
    // Buscar email do motorista
  } else if (isMotorista) {
    avaliadoEmail = pedido?.created_by;
    avaliadoNome = pedido?.nome_cliente;
    tipoAvaliador = 'motorista';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Pedido não encontrado</h2>
          <Link to={createPageUrl('MeusPedidos')}>
            <Button variant="outline">Voltar aos pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const servico = servicoConfig[pedido.tipo_servico];
  const Icon = servico?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('MeusPedidos')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Detalhes do Pedido</h1>
              <p className="text-slate-500">
                Criado em {pedido.created_date && format(new Date(pedido.created_date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O pedido será permanentemente excluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(pedidoId)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Service Card */}
            <Card className="border-slate-100 rounded-2xl overflow-hidden">
              <div 
                className="h-2"
                style={{ backgroundColor: servico?.color }}
              />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${servico?.color}15` }}
                    >
                      {Icon && <Icon className="w-7 h-7" style={{ color: servico?.color }} />}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{servico?.title}</CardTitle>
                      <p className="text-slate-500 text-sm mt-1">{servico?.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={pedido.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Distância e Tempo */}
                {(pedido.distancia_km !== null && pedido.distancia_km !== undefined) && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium">Distância</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {pedido.distancia_km} km
                        </p>
                      </div>
                      {pedido.tempo_estimado && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-blue-600 font-medium">Tempo</p>
                          </div>
                          <p className="text-lg font-semibold text-blue-700">
                            {pedido.tempo_estimado}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Origem</p>
                      <p className="text-slate-800 font-medium">{pedido.endereco_origem}</p>
                    </div>
                  </div>
                  {pedido.endereco_destino && (
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Destino</p>
                        <p className="text-slate-800 font-medium">{pedido.endereco_destino}</p>
                      </div>
                    </div>
                  )}
                </div>

                {pedido.descricao && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-500">Descrição</p>
                    </div>
                    <p className="text-slate-700">{pedido.descricao}</p>
                  </div>
                )}

                {pedido.observacoes && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-600 mb-1 font-medium">Observações</p>
                    <p className="text-amber-800">{pedido.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Nome</p>
                      <p className="font-medium text-slate-800">{pedido.nome_cliente}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="font-medium text-slate-800">{pedido.telefone_cliente}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Schedule */}
            {(pedido.data_agendada || pedido.horario) && (
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.data_agendada && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-700">
                        {format(new Date(pedido.data_agendada), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {pedido.horario && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-700">{pedido.horario}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Update */}
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Atualizar Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={pedido.status} 
                  onValueChange={handleStatusChange}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Pendente
                      </span>
                    </SelectItem>
                    <SelectItem value="confirmado">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Confirmado
                      </span>
                    </SelectItem>
                    <SelectItem value="em_andamento">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        Em Andamento
                      </span>
                    </SelectItem>
                    <SelectItem value="concluido">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Concluído
                      </span>
                    </SelectItem>
                    <SelectItem value="cancelado">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Cancelado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pedido.status !== 'concluido' && pedido.status !== 'cancelado' && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => handleStatusChange('concluido')}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Concluído
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
                      onClick={() => handleStatusChange('cancelado')}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Pedido
                    </Button>
                  </>
                )}
                <a href={`tel:${pedido.telefone_cliente}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar para Cliente
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Avaliações */}
            {pedido.status === 'concluido' && (isCliente || isMotorista) && (
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {avaliacaoRecebida && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-600 mb-2 font-medium">Você recebeu uma avaliação</p>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i <= avaliacaoRecebida.nota ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      {avaliacaoRecebida.comentario && (
                        <p className="text-sm text-slate-700 italic">"{avaliacaoRecebida.comentario}"</p>
                      )}
                    </div>
                  )}

                  {podeAvaliar ? (
                    <Button
                      onClick={() => setShowAvaliacaoModal(true)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar {isCliente ? 'Motorista' : 'Cliente'}
                    </Button>
                  ) : minhaAvaliacao ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-600 mb-2 font-medium">Sua avaliação</p>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i <= minhaAvaliacao.nota ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      {minhaAvaliacao.comentario && (
                        <p className="text-sm text-slate-700 italic">"{minhaAvaliacao.comentario}"</p>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Value & Payment */}
            {pedido.valor_total && (
              <Card className="border-slate-100 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <p className="text-orange-100 text-sm mb-1">Valor Total</p>
                  <p className="text-3xl font-bold mb-2">
                    R$ {pedido.valor_total.toFixed(2)}
                  </p>
                  {pedido.valor_calculado && pedido.valor_calculado !== pedido.valor_total && (
                    <p className="text-orange-100 text-xs">
                      (Calculado: R$ {pedido.valor_calculado.toFixed(2)})
                    </p>
                  )}
                  {pedido.metodo_pagamento && (
                    <div className="pt-3 border-t border-orange-400/30">
                      <p className="text-orange-100 text-xs mb-1">Método de Pagamento</p>
                      <p className="font-semibold">
                        {pedido.metodo_pagamento === 'pix' ? '💳 PIX' :
                         pedido.metodo_pagamento === 'cartao_credito' ? '💳 Cartão de Crédito' :
                         pedido.metodo_pagamento === 'cartao_debito' ? '💳 Cartão de Débito' :
                         '💵 Dinheiro'}
                      </p>
                    </div>
                  )}
                  {pedido.status_pagamento && (
                    <div className="mt-3 pt-3 border-t border-orange-400/30">
                      <p className="text-orange-100 text-xs mb-1">Status do Pagamento</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        pedido.status_pagamento === 'pago' ? 'bg-green-500' :
                        pedido.status_pagamento === 'estornado' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}>
                        {pedido.status_pagamento === 'pago' ? '✓ Pago' :
                         pedido.status_pagamento === 'estornado' ? '✗ Estornado' :
                         '⏱ Pendente'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {showAvaliacaoModal && podeAvaliar && (
            <AvaliacaoModal
              pedido={pedido}
              onClose={() => setShowAvaliacaoModal(false)}
              tipoAvaliador={tipoAvaliador}
              avaliadoEmail={avaliadoEmail || pedido.created_by}
              avaliadoNome={avaliadoNome}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}