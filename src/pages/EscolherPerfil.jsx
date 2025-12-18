import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { User, Truck, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function EscolherPerfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selecionados, setSelecionados] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Perfil configurado!');
      navigate(createPageUrl('Home'));
    }
  });

  const toggleSelecao = (tipo) => {
    setSelecionados(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const handleContinuar = () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos um perfil');
      return;
    }
    
    updateMutation.mutate({
      tipos_conta: selecionados,
      modo_ativo: selecionados[0]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Bem-vindo! 👋
          </h1>
          <p className="text-slate-600">
            Como você deseja usar o sistema?
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className={`cursor-pointer transition-all ${
                selecionados.includes('cliente')
                  ? 'border-orange-500 border-2 shadow-lg shadow-orange-500/20'
                  : 'border-slate-200 hover:border-orange-300'
              }`}
              onClick={() => toggleSelecao('cliente')}
            >
              <CardContent className="p-6 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  {selecionados.includes('cliente') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-1/2 translate-x-10 bg-orange-500 rounded-full p-1"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Sou Cliente
                </h3>
                <p className="text-slate-600 text-sm">
                  Quero solicitar entregas e serviços
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className={`cursor-pointer transition-all ${
                selecionados.includes('motorista')
                  ? 'border-orange-500 border-2 shadow-lg shadow-orange-500/20'
                  : 'border-slate-200 hover:border-orange-300'
              }`}
              onClick={() => toggleSelecao('motorista')}
            >
              <CardContent className="p-6 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-10 h-10 text-white" />
                  </div>
                  {selecionados.includes('motorista') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-1/2 translate-x-10 bg-orange-500 rounded-full p-1"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Sou Motorista
                </h3>
                <p className="text-slate-600 text-sm">
                  Quero fazer entregas e ganhar dinheiro
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {selecionados.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center"
          >
            <p className="text-blue-800 text-sm">
              ✨ Ótimo! Você poderá alternar entre os perfis a qualquer momento
            </p>
          </motion.div>
        )}

        <Button
          onClick={handleContinuar}
          disabled={selecionados.length === 0 || updateMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-xl text-lg"
        >
          {updateMutation.isPending ? (
            'Configurando...'
          ) : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}