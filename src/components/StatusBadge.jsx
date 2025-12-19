import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  pendente: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    label: 'Pendente'
  },
  confirmado: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    label: 'Confirmado'
  },
  em_andamento: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    dot: 'bg-violet-500',
    label: 'Em Andamento'
  },
  em_rota: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    dot: 'bg-purple-500',
    label: 'Em Rota'
  },
  concluido: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'Concluído'
  },
  cancelado: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Cancelado'
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pendente;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
      config.bg,
      config.text
    )}>
      <span className={cn("w-2 h-2 rounded-full", config.dot)} />
      {config.label}
    </div>
  );
}