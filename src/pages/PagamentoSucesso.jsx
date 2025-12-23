import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedido_id');

  useEffect(() => {
    // Animação de confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Verificar pagamento
    const verificarPagamento = async () => {
      if (!pedidoId) return;
      
      try {
        await base44.functions.invoke('verificarPagamento', { pedido_id: pedidoId });
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      } finally {
        setVerificando(false);
      }
    };

    verificarPagamento();
  }, [pedidoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Pagamento Confirmado!
        </h1>
        <p className="text-slate-600 mb-8">
          Seu pagamento foi processado com sucesso. Estamos buscando um motorista para você.
        </p>

        {verificando && (
          <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verificando pagamento...</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => navigate(createPageUrl('DetalhePedido') + '?id=' + pedidoId)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl h-12"
          >
            Ver Detalhes do Pedido
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button
            onClick={() => navigate(createPageUrl('MeusPedidos'))}
            variant="outline"
            className="w-full rounded-xl h-12"
          >
            Ver Todos os Pedidos
          </Button>
        </div>
      </motion.div>
    </div>
  );
}