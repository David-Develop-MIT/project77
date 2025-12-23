import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Navigation, Package, CheckCircle, AlertCircle, Clock, HelpCircle } from 'lucide-react';

export default function SugestoesInteligentes({ pedido, modoAtivo, onSelectSugestao }) {
  const sugestoes = useMemo(() => {
    if (!pedido) return [];

    const status = pedido.status;
    const isMotorista = modoAtivo === 'motorista';
    const isCliente = modoAtivo === 'cliente';

    // Sugestões para motorista baseadas no status
    if (isMotorista) {
      switch (status) {
        case 'confirmado':
          return [
            { icon: Navigation, text: 'Estou a caminho do local de coleta', color: 'blue' },
            { icon: Clock, text: 'Chegarei em aproximadamente 10 minutos', color: 'orange' },
            { icon: AlertCircle, text: 'Pode ter um pequeno atraso devido ao trânsito', color: 'red' }
          ];
        case 'em_rota':
          return [
            { icon: Package, text: 'Cheguei ao local de coleta', color: 'green' },
            { icon: AlertCircle, text: 'Há alguma informação adicional sobre a coleta?', color: 'yellow' },
            { icon: HelpCircle, text: 'Não encontrei o endereço, pode me ajudar?', color: 'orange' }
          ];
        case 'em_andamento':
          return [
            { icon: Package, text: 'Pacote coletado, a caminho da entrega', color: 'blue' },
            { icon: Navigation, text: 'Estou próximo do local de entrega', color: 'green' },
            { icon: CheckCircle, text: 'Cheguei ao destino', color: 'green' }
          ];
        default:
          return [
            { icon: CheckCircle, text: 'Aceito fazer essa entrega', color: 'green' },
            { icon: Clock, text: 'Quanto tempo tenho para coletar?', color: 'orange' }
          ];
      }
    }

    // Sugestões para cliente baseadas no status
    if (isCliente) {
      switch (status) {
        case 'pendente':
          return [
            { icon: HelpCircle, text: 'Quanto tempo demora para aceitar?', color: 'blue' },
            { icon: Package, text: 'Há alguma orientação especial para coleta?', color: 'orange' }
          ];
        case 'confirmado':
          return [
            { icon: Navigation, text: 'Qual sua localização atual?', color: 'blue' },
            { icon: Clock, text: 'Quanto tempo até chegar?', color: 'orange' }
          ];
        case 'em_rota':
          return [
            { icon: CheckCircle, text: 'Estou no local aguardando', color: 'green' },
            { icon: AlertCircle, text: 'Precisa de ajuda para encontrar o endereço?', color: 'yellow' },
            { icon: HelpCircle, text: 'O item está na portaria/recepção', color: 'blue' }
          ];
        case 'em_andamento':
          return [
            { icon: CheckCircle, text: 'Obrigado! Entrega confirmada', color: 'green' },
            { icon: AlertCircle, text: 'O pacote está danificado?', color: 'red' },
            { icon: HelpCircle, text: 'Tem previsão de chegada?', color: 'orange' }
          ];
        default:
          return [
            { icon: HelpCircle, text: 'Como funciona o processo?', color: 'blue' },
            { icon: Clock, text: 'Qual o prazo de entrega?', color: 'orange' }
          ];
      }
    }

    return [];
  }, [pedido, modoAtivo]);

  if (sugestoes.length === 0) return null;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mb-3"
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-slate-600">Sugestões rápidas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sugestoes.map((sugestao, index) => {
            const Icon = sugestao.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectSugestao(sugestao.text)}
                  className={`${colorClasses[sugestao.color]} rounded-full text-xs border transition-all`}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {sugestao.text}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}