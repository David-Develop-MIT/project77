import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  pendente: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  confirmado: {
    label: 'Confirmado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  em_andamento: {
    label: 'Em Andamento',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500'
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400'
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pendente;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
      config.bg, config.text
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}