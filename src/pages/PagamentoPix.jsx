import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Loader2, Copy, CheckCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PagamentoPix() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedido_id');
  const paymentIntentId = urlParams.get('payment_intent_id');
  
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempoRestante, setTempoRestante] = useState(420); // 7 minutos em segundos
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState('aguardando');

  // Buscar dados do PIX
  useEffect(() => {
    const buscarPixData = async () => {
      try {
        const { data } = await base44.functions.invoke('obterDadosPix', {
          payment_intent_id: paymentIntentId
        });
        
        setPixData(data);
      } catch (error) {
        console.error('Erro ao buscar dados PIX:', error);
        toast.error('Erro ao carregar dados do pagamento');
      } finally {
        setLoading(false);
      }
    };

    if (paymentIntentId) {
      buscarPixData();
    }
  }, [paymentIntentId]);

  // Contador regressivo
  useEffect(() => {
    if (tempoRestante <= 0) {
      setStatusPagamento('expirado');
      return;
    }

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusPagamento('expirado');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempoRestante]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (statusPagamento !== 'aguardando') return;

    const verificar = async () => {
      setVerificandoPagamento(true);
      try {
        const { data } = await base44.functions.invoke('verificarPagamento', {
          pedido_id: pedidoId
        });
        
        if (data.status === 'concluida') {
          setStatusPagamento('pago');
          toast.success('Pagamento confirmado!');
          setTimeout(() => {
            navigate(createPageUrl('PagamentoSucesso') + '?pedido_id=' + pedidoId);
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      } finally {
        setVerificandoPagamento(false);
      }
    };

    const interval = setInterval(verificar, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, [pedidoId, statusPagamento, navigate]);

  const copiarChavePix = () => {
    if (pixData?.pix_codigo) {
      navigator.clipboard.writeText(pixData.pix_codigo);
      toast.success('Chave PIX copiada!');
    }
  };

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (statusPagamento === 'expirado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Pagamento Expirado</h1>
          <p className="text-slate-600 mb-6">
            O tempo para pagamento expirou. Você pode criar um novo pedido.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('NovoPedido'))}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            Criar Novo Pedido
          </Button>
        </motion.div>
      </div>
    );
  }

  if (statusPagamento === 'pago') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Pagamento Confirmado!</h1>
          <p className="text-slate-600">Redirecionando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Pagamento via PIX</span>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-lg">{formatarTempo(tempoRestante)}</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* QR Code */}
              {pixData?.qr_code_url && (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4">
                    <img 
                      src={pixData.qr_code_url} 
                      alt="QR Code PIX" 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>
              )}

              {/* Chave PIX */}
              {pixData?.pix_codigo && (
                <div>
                  <p className="text-sm text-slate-600 mb-2 text-center">
                    Ou copie a chave PIX abaixo:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-sm text-slate-700 break-all font-mono">
                        {pixData.pix_codigo}
                      </p>
                    </div>
                    <Button
                      onClick={copiarChavePix}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Valor */}
              {pixData?.valor && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Valor a pagar</p>
                  <p className="text-3xl font-bold text-blue-700">
                    R$ {pixData.valor.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-slate-600">
                {verificandoPagamento ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verificando pagamento...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-sm">Aguardando pagamento</span>
                  </>
                )}
              </div>

              {/* Instruções */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">Como pagar:</h3>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="font-semibold text-orange-500">1.</span>
                    <span>Abra o app do seu banco</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-orange-500">2.</span>
                    <span>Escolha pagar com PIX QR Code ou Copia e Cola</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-orange-500">3.</span>
                    <span>Escaneie o QR Code ou cole a chave PIX</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-orange-500">4.</span>
                    <span>Confirme o pagamento</span>
                  </li>
                </ol>
              </div>

              {/* Botão Cancelar */}
              <Button
                onClick={() => navigate(createPageUrl('MeusPedidos'))}
                variant="outline"
                className="w-full rounded-xl"
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}