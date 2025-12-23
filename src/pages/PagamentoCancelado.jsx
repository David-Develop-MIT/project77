import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PagamentoCancelado() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedido_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <XCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Pagamento Cancelado
        </h1>
        <p className="text-slate-600 mb-8">
          O pagamento foi cancelado. Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
        </p>

        <div className="space-y-3">
          {pedidoId && (
            <Button
              onClick={() => navigate(createPageUrl('DetalhePedido') + '?id=' + pedidoId)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Pedido
            </Button>
          )}
          
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full rounded-xl h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para Início
          </Button>
        </div>
      </motion.div>
    </div>
  );
}