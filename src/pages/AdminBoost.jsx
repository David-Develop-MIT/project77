import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Award, RefreshCw, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function AdminBoost() {
  const [editando, setEditando] = useState({});
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: motoristas = [] } = useQuery({
    queryKey: ['motoristas-boost'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      const motoristasData = await base44.entities.Motorista.list();
      
      return users
        .filter(u => u.tipos_conta?.includes('motorista'))
        .map(u => {
          const motoristaInfo = motoristasData.find(m => m.id === u.motorista_id);
          return {
            ...u,
            motorista_nome: motoristaInfo?.nome || u.full_name
          };
        });
    },
    enabled: user?.role === 'admin'
  });

  const recalcularTodosMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calcularBoostMotorista', {
        recalcular_todos: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['motoristas-boost']);
      toast.success('Boost recalculado para todos os motoristas!');
    }
  });

  const atualizarBoostManualMutation = useMutation({
    mutationFn: async ({ userId, boostManual }) => {
      await base44.entities.User.update(userId, {
        boost_manual: boostManual,
        boost_nivel: Math.max(boostManual, 0)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['motoristas-boost']);
      setEditando({});
      toast.success('Boost manual atualizado!');
    }
  });

  const handleSalvar = (motorista) => {
    const novoBoost = editando[motorista.id] ?? motorista.boost_manual ?? 0;
    atualizarBoostManualMutation.mutate({
      userId: motorista.id,
      boostManual: novoBoost
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
            <h1 className="text-2xl font-bold text-slate-800">Gerenciar Boost de Motoristas</h1>
            <p className="text-slate-500">Ajustar prioridade e recalcular boost automaticamente</p>
          </div>
          <Button
            onClick={() => recalcularTodosMutation.mutate()}
            disabled={recalcularTodosMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl"
          >
            {recalcularTodosMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recalculando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalcular Todos
              </>
            )}
          </Button>
        </motion.div>

        <Card className="border-slate-200 rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Como funciona o Boost?</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <strong>Boost Automático:</strong> Calculado baseado em entregas concluídas, taxa de conclusão, avaliações recentes e tempo médio</li>
                  <li>• <strong>Boost Manual:</strong> Ajuste feito pelo admin para casos especiais (soma ao automático)</li>
                  <li>• <strong>Boost Final:</strong> Usado no algoritmo de alocação para priorizar motoristas (0-10)</li>
                  <li>• Recalcule periodicamente para manter os valores atualizados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {motoristas.map((motorista, index) => {
            const boostAtual = motorista.boost_nivel || 0;
            const boostAuto = motorista.boost_automatico || 0;
            const boostManual = motorista.boost_manual || 0;
            const boostEditando = editando[motorista.id] ?? boostManual;

            return (
              <motion.div
                key={motorista.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200 rounded-2xl hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{motorista.motorista_nome}</h3>
                        <p className="text-sm text-slate-500">{motorista.email}</p>
                        {motorista.avaliacao_media_motorista && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-600">
                              ⭐ {motorista.avaliacao_media_motorista.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({motorista.total_avaliacoes_motorista || 0} avaliações)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-700 mb-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Boost: {boostAtual}
                        </Badge>
                        <p className="text-xs text-slate-500">Auto: {boostAuto} | Manual: {boostManual}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Boost Manual (Admin)</span>
                          <span className="text-sm font-semibold text-orange-600">{boostEditando}</span>
                        </div>
                        <Slider
                          value={[boostEditando]}
                          onValueChange={(value) => setEditando({ ...editando, [motorista.id]: value[0] })}
                          max={10}
                          step={1}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>0 (Sem prioridade)</span>
                          <span>10 (Máxima prioridade)</span>
                        </div>
                      </div>

                      {boostEditando !== boostManual && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex gap-2"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const { [motorista.id]: _, ...rest } = editando;
                              setEditando(rest);
                            }}
                            className="flex-1 rounded-lg"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSalvar(motorista)}
                            disabled={atualizarBoostManualMutation.isPending}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-lg"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {motoristas.length === 0 && (
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum motorista cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}