import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, FileText, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFaturas() {
  const [faturaEmAnalise, setFaturaEmAnalise] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: faturas = [] } = useQuery({
    queryKey: ['faturas-admin'],
    queryFn: async () => {
      const todas = await base44.entities.Fatura.list('-periodo_fim', 200);
      return todas;
    },
    enabled: user?.role === 'admin'
  });

  const aprovarMutation = useMutation({
    mutationFn: async ({ fatura_id, aprovar, observacoes }) => {
      const response = await base44.functions.invoke('aprovarFatura', {
        fatura_id,
        aprovar,
        observacoes
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['faturas-admin']);
      setFaturaEmAnalise(null);
      setObservacoes('');
      toast.success(variables.aprovar ? 'Fatura aprovada!' : 'Fatura rejeitada');
    }
  });

  const statusConfig = {
    aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-700' },
    fechada: { label: 'Aguardando Análise', color: 'bg-yellow-100 text-yellow-700' },
    aguardando_aprovacao: { label: 'Aguardando', color: 'bg-orange-100 text-orange-700' },
    aprovada: { label: 'Aprovada', color: 'bg-green-100 text-green-700' },
    paga: { label: 'Paga', color: 'bg-emerald-100 text-emerald-700' },
    rejeitada: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Acesso restrito a administradores</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const faturasAguardando = faturas.filter(f => f.status === 'fechada' || f.status === 'aguardando_aprovacao');
  const faturasAprovadas = faturas.filter(f => f.status === 'aprovada');
  const faturasPagas = faturas.filter(f => f.status === 'paga');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Gerenciar Faturas</h1>
            <p className="text-slate-500">Aprovar e gerenciar pagamentos de motoristas</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Aguardando Análise</p>
              <p className="text-2xl font-bold text-yellow-600">{faturasAguardando.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Aprovadas</p>
              <p className="text-2xl font-bold text-green-600">{faturasAprovadas.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Pagas</p>
              <p className="text-2xl font-bold text-emerald-600">{faturasPagas.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Faturas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Todas as Faturas</h2>
          {faturas.length === 0 ? (
            <Card className="border-slate-200 rounded-2xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma fatura cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {faturas.map((fatura, index) => {
                const config = statusConfig[fatura.status];
                return (
                  <motion.div
                    key={fatura.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-slate-200 rounded-2xl hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{fatura.motorista_email}</h3>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(fatura.periodo_inicio), 'dd MMM', { locale: ptBR })} - {format(new Date(fatura.periodo_fim), 'dd MMM yyyy', { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm mt-4">
                              <div>
                                <span className="text-slate-500">Entregas:</span>
                                <p className="font-medium">{fatura.total_entregas || 0}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Bruto:</span>
                                <p className="font-medium">R$ {(fatura.valor_bruto || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Taxas:</span>
                                <p className="font-medium text-red-600">- R$ {(fatura.taxas || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Líquido:</span>
                                <p className="font-bold text-green-600">R$ {(fatura.valor_liquido || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={config.color}>{config.label}</Badge>
                            {(fatura.status === 'fechada' || fatura.status === 'aguardando_aprovacao') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFaturaEmAnalise(fatura)}
                                className="rounded-lg"
                              >
                                Analisar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Análise */}
        <Dialog open={!!faturaEmAnalise} onOpenChange={() => setFaturaEmAnalise(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Analisar Fatura</DialogTitle>
            </DialogHeader>
            {faturaEmAnalise && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Motorista:</span>
                    <span className="font-medium">{faturaEmAnalise.motorista_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Período:</span>
                    <span className="font-medium">
                      {format(new Date(faturaEmAnalise.periodo_inicio), 'dd/MM', { locale: ptBR })} - {format(new Date(faturaEmAnalise.periodo_fim), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Entregas:</span>
                    <span className="font-medium">{faturaEmAnalise.total_entregas}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-semibold">Valor a Pagar:</span>
                    <span className="font-bold text-green-600 text-lg">
                      R$ {(faturaEmAnalise.valor_liquido || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações sobre esta fatura..."
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => aprovarMutation.mutate({
                  fatura_id: faturaEmAnalise.id,
                  aprovar: false,
                  observacoes
                })}
                disabled={aprovarMutation.isPending}
                className="rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={() => aprovarMutation.mutate({
                  fatura_id: faturaEmAnalise.id,
                  aprovar: true,
                  observacoes
                })}
                disabled={aprovarMutation.isPending}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                {aprovarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}