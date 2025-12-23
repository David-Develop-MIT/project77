import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Receipt, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoTransacoes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: transacoes = [] } = useQuery({
    queryKey: ['transacoes', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Transacao.list('-created_date', 200);
      return todas.filter(t => 
        t.cliente_email === user?.email || t.motorista_email === user?.email
      );
    },
    enabled: !!user?.email
  });

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    processando: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Clock },
    concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    falhada: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: XCircle },
    reembolsada: { label: 'Reembolsada', color: 'bg-slate-100 text-slate-700', icon: TrendingDown }
  };

  if (transacoes.length === 0) {
    return (
      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma transação encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Histórico de Transações</h3>
      
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {transacoes.map((transacao, index) => {
            const config = statusConfig[transacao.status];
            const Icon = config.icon;
            const isReceita = transacao.motorista_email === user?.email;

            return (
              <motion.div
                key={transacao.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200 rounded-xl hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isReceita ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isReceita ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {isReceita ? 'Ganho de Entrega' : 'Pagamento de Entrega'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(transacao.created_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <p className={`text-lg font-bold ${
                              isReceita ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isReceita ? '+' : '-'} R$ {(isReceita ? transacao.valor_motorista : transacao.valor).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={config.color}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            {isReceita && transacao.taxa_plataforma > 0 && (
                              <span className="text-xs text-slate-500">
                                Taxa: R$ {transacao.taxa_plataforma.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {transacao.erro_mensagem && (
                            <p className="text-xs text-red-600 mt-2">
                              {transacao.erro_mensagem}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}