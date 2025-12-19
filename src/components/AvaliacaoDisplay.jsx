import React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AvaliacaoDisplay({ nota, totalAvaliacoes, size = 'md' }) {
  if (!nota || totalAvaliacoes === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <Star className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-300`} />
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-400`}>
          Sem avaliações
        </span>
      </div>
    );
  }

  const notaFormatada = nota.toFixed(1);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Star className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} fill-yellow-400 text-yellow-400`} />
        <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} font-semibold text-slate-800`}>
          {notaFormatada}
        </span>
      </div>
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-500`}>
        ({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
      </span>
    </div>
  );
}