import React from 'react';
import { Trophy, Star, Zap, Award, Target, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const conquistas = [
  {
    id: 'primeira_entrega',
    nome: 'Primeira Entrega',
    descricao: 'Complete sua primeira entrega',
    icone: Trophy,
    cor: '#10b981',
    requisito: (stats) => stats.totalEntregas >= 1
  },
  {
    id: 'entregador_bronze',
    nome: 'Entregador Bronze',
    descricao: 'Complete 10 entregas',
    icone: Award,
    cor: '#cd7f32',
    requisito: (stats) => stats.totalEntregas >= 10
  },
  {
    id: 'entregador_prata',
    nome: 'Entregador Prata',
    descricao: 'Complete 50 entregas',
    icone: Award,
    cor: '#c0c0c0',
    requisito: (stats) => stats.totalEntregas >= 50
  },
  {
    id: 'entregador_ouro',
    nome: 'Entregador Ouro',
    descricao: 'Complete 100 entregas',
    icone: Award,
    cor: '#ffd700',
    requisito: (stats) => stats.totalEntregas >= 100
  },
  {
    id: 'cinco_estrelas',
    nome: '5 Estrelas',
    descricao: 'Mantenha avaliação média de 5.0',
    icone: Star,
    cor: '#fbbf24',
    requisito: (stats) => stats.avaliacaoMedia >= 5.0 && stats.totalAvaliacoes >= 10
  },
  {
    id: 'rapido_e_furioso',
    nome: 'Rápido e Eficiente',
    descricao: 'Complete 5 entregas em um dia',
    icone: Zap,
    cor: '#8b5cf6',
    requisito: (stats) => stats.maxEntregasDia >= 5
  },
  {
    id: 'pontualidade',
    nome: 'Pontual',
    descricao: 'Complete 20 entregas sem atrasos',
    icone: Clock,
    cor: '#3b82f6',
    requisito: (stats) => stats.entregasNoPrazo >= 20
  },
  {
    id: 'bem_avaliado',
    nome: 'Bem Avaliado',
    descricao: 'Receba 50 avaliações positivas',
    icone: ThumbsUp,
    cor: '#ec4899',
    requisito: (stats) => stats.totalAvaliacoes >= 50 && stats.avaliacaoMedia >= 4.5
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Mantenha 95% de entregas concluídas',
    icone: Target,
    cor: '#14b8a6',
    requisito: (stats) => (stats.totalEntregas > 0 && (stats.entregasConcluidas / stats.totalEntregas) >= 0.95)
  },
  {
    id: 'top_ganhos',
    nome: 'Top de Ganhos',
    descricao: 'Acumule R$ 5.000 em entregas',
    icone: TrendingUp,
    cor: '#f59e0b',
    requisito: (stats) => stats.totalGanhos >= 5000
  }
];

export default function ConquistasMotorista({ stats, conquistasDesbloqueadas = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {conquistas.map((conquista, index) => {
        const Icon = conquista.icone;
        const desbloqueada = conquista.requisito(stats) || conquistasDesbloqueadas.includes(conquista.id);
        
        return (
          <motion.div
            key={conquista.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={`rounded-xl transition-all ${
                desbloqueada 
                  ? 'border-2 hover:shadow-lg cursor-pointer' 
                  : 'border-slate-200 opacity-50'
              }`}
              style={{ borderColor: desbloqueada ? conquista.cor : undefined }}
            >
              <CardContent className="p-4 text-center">
                <div 
                  className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    desbloqueada ? 'shadow-lg' : 'bg-slate-100'
                  }`}
                  style={{ 
                    backgroundColor: desbloqueada ? `${conquista.cor}15` : undefined
                  }}
                >
                  <Icon 
                    className="w-7 h-7"
                    style={{ color: desbloqueada ? conquista.cor : '#94a3b8' }}
                  />
                </div>
                <h4 className={`font-semibold text-sm mb-1 ${
                  desbloqueada ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {conquista.nome}
                </h4>
                <p className={`text-xs ${
                  desbloqueada ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {conquista.descricao}
                </p>
                {desbloqueada && (
                  <div className="mt-2">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: `${conquista.cor}20`,
                        color: conquista.cor
                      }}
                    >
                      ✓ Desbloqueada
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}