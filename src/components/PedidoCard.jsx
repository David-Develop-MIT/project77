import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Calendar, Phone, User, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { servicoConfig } from './servicoConfig';

export default function PedidoCard({ pedido, onClick }) {
  const servico = servicoConfig[pedido.tipo_servico];
  const Icon = servico?.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${servico?.color}15` }}
          >
            {Icon && <Icon className="w-5 h-5" style={{ color: servico?.color }} />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{servico?.title}</h3>
            <p className="text-xs text-slate-400">
              {pedido.created_date && format(new Date(pedido.created_date), "dd MMM, HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <StatusBadge status={pedido.status} />
      </div>
      
      <div className="space-y-2.5 mb-4">
        <div className="flex items-start gap-2.5 text-sm">
          <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-slate-600 line-clamp-1">{pedido.endereco_origem}</span>
          </div>
        </div>
        
        {pedido.endereco_destino && (
          <div className="flex items-start gap-2.5 text-sm">
            <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-slate-600 line-clamp-1">{pedido.endereco_destino}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {pedido.nome_cliente}
          </span>
          {pedido.data_agendada && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(pedido.data_agendada), "dd/MM")}
            </span>
          )}
        </div>
        {pedido.valor_estimado && (
          <span className="font-semibold text-slate-800">
            R$ {pedido.valor_estimado.toFixed(2)}
          </span>
        )}
      </div>
    </motion.div>
  );
}