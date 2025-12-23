import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Truck, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';

export default function CompletarPerfilInicial() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: usuarioPickup } = useQuery({
    queryKey: ['usuarioPickup', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const usuarios = await base44.entities.UsuarioPickup.list();
      return usuarios.find(u => u.email === user.email);
    },
    enabled: !!user?.email
  });

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleContinue = async () => {
    if (!selectedMode) {
      toast.error('Por favor, selecione uma modalidade');
      return;
    }

    setIsLoading(true);

    try {
      if (usuarioPickup) {
        // Atualizar UsuarioPickup existente
        await base44.entities.UsuarioPickup.update(usuarioPickup.id, {
          tipos_conta: [selectedMode],
          modo_ativo: selectedMode
        });
      } else {
        // Criar novo UsuarioPickup
        await base44.entities.UsuarioPickup.create({
          name: user.full_name,
          email: user.email,
          token_acesso: Math.random().toString(36).substring(2, 15),
          tipos_conta: [selectedMode],
          modo_ativo: selectedMode,
          ativo: true
        });
      }

      // Atualizar user do base44
      await base44.auth.updateMe({
        tipos_conta: [selectedMode],
        modo_ativo: selectedMode,
        perfil_completo: true
      });

      toast.success('Perfil configurado com sucesso!');
      setTimeout(() => {
        navigate(createPageUrl('Home'));
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error('Erro ao configurar perfil');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Complete seu Perfil</h1>
          <p className="text-slate-600">Escolha como você deseja usar o aplicativo</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`cursor-pointer transition-all border-2 ${
                selectedMode === 'cliente'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleModeSelect('cliente')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  {selectedMode === 'cliente' && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <CardTitle className="text-xl">Sou Cliente</CardTitle>
                <CardDescription>
                  Solicite serviços de entrega, frete, carreto e mais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Solicite entregas rapidamente
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Acompanhe em tempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Pagamento seguro
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`cursor-pointer transition-all border-2 ${
                selectedMode === 'motorista'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleModeSelect('motorista')}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  {selectedMode === 'motorista' && (
                    <CheckCircle className="w-6 h-6 text-orange-500" />
                  )}
                </div>
                <CardTitle className="text-xl">Sou Motorista</CardTitle>
                <CardDescription>
                  Realize entregas e ganhe dinheiro com seu veículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Receba pedidos próximos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Defina seus horários
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Ganhos transparentes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedMode || isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl h-14 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            'Continuar'
          )}
        </Button>

        <p className="text-center text-xs text-slate-500 mt-6">
          Você poderá adicionar mais modalidades posteriormente
        </p>
      </motion.div>
    </div>
  );
}