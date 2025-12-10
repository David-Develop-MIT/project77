import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Wallet, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentIcons = {
  pix: Smartphone,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  dinheiro: Wallet
};

const paymentLabels = {
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro'
};

const paymentColors = {
  pix: 'from-teal-500 to-teal-600',
  cartao_credito: 'from-blue-500 to-blue-600',
  cartao_debito: 'from-violet-500 to-violet-600',
  dinheiro: 'from-emerald-500 to-emerald-600'
};

export default function PaymentMethodCard({ method, selected, onClick }) {
  const Icon = paymentIcons[method];
  const label = paymentLabels[method];
  const gradient = paymentColors[method];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl p-5 transition-all duration-300 border-2",
        selected 
          ? "border-orange-500 shadow-lg shadow-orange-500/20" 
          : "border-slate-100 hover:border-slate-200 bg-white"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
          gradient
        )}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {method === 'pix' && 'Pagamento instantâneo'}
            {method === 'cartao_credito' && 'Parcelamento disponível'}
            {method === 'cartao_debito' && 'Débito na hora'}
            {method === 'dinheiro' && 'Pagar na entrega'}
          </p>
        </div>

        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}