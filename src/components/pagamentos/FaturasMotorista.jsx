import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { FileText, Download, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FaturasMotorista() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: faturas = [] } = useQuery({
    queryKey: ['faturas', user?.email],
    queryFn: async () => {
      const todas = await base44.entities.Fatura.list('-periodo_fim', 50);
      return todas.filter(f => f.motorista_email === user?.email);
    },
    enabled: !!user?.email
  });

  const statusConfig = {
    aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-700' },
    fechada: { label: 'Fechada', color: 'bg-yellow-100 text-yellow-700' },
    paga: { label: 'Paga', color: 'bg-green-100 text-green-700' }
  };

  if (faturas.length === 0) {
    return (
      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma fatura disponível ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Minhas Faturas</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {faturas.map((fatura, index) => {
          const config = statusConfig[fatura.status];

          return (
            <motion.div
              key={fatura.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-slate-200 rounded-2xl hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-semibold text-slate-800">
                            Fatura {format(new Date(fatura.periodo_inicio), 'MMM yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(fatura.periodo_inicio), 'dd MMM', { locale: ptBR })} - {format(new Date(fatura.periodo_fim), 'dd MMM', { locale: ptBR })}
                          </p>
                        </div>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Entregas:</span>
                      <span className="font-medium">{fatura.total_entregas || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Valor Bruto:</span>
                      <span className="font-medium">R$ {(fatura.valor_bruto || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxas:</span>
                      <span className="font-medium text-red-600">- R$ {(fatura.taxas || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-800">Valor Líquido:</span>
                      <span className="font-bold text-green-600 text-lg">
                        R$ {(fatura.valor_liquido || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Fatura
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}