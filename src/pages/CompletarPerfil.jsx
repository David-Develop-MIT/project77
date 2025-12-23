import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Truck, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    full_name: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    tipos_conta: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const atualizarPerfilMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Perfil criado com sucesso!');
      navigate(createPageUrl('Home'));
    },
    onError: () => {
      toast.error('Erro ao criar perfil. Tente novamente.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('Por favor, preencha seu nome completo');
      return;
    }
    
    if (!formData.telefone.trim()) {
      toast.error('Por favor, preencha seu telefone');
      return;
    }
    
    if (formData.tipos_conta.length === 0) {
      toast.error('Selecione pelo menos um tipo de conta');
      return;
    }

    const dataToSave = {
      ...formData,
      modo_ativo: formData.tipos_conta[0],
      perfil_completo: true
    };

    atualizarPerfilMutation.mutate(dataToSave);
  };

  const toggleTipoConta = (tipo) => {
    setFormData(prev => {
      const tipos = prev.tipos_conta.includes(tipo)
        ? prev.tipos_conta.filter(t => t !== tipo)
        : [...prev.tipos_conta, tipo];
      return { ...prev, tipos_conta: tipos };
    });
  };

  React.useEffect(() => {
    if (user?.full_name) {
      setFormData(prev => ({ ...prev, full_name: user.full_name }));
    }
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Bem-vindo ao Pickup Brasil!
          </h1>
          <p className="text-slate-600">
            Complete seu perfil para começar a usar nossa plataforma
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Preencha seus dados para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telefone" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Telefone *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço (Opcional)
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="CEP"
                      value={formData.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Input
                        placeholder="Endereço"
                        value={formData.endereco}
                        onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <Input
                      placeholder="Estado"
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      className="rounded-xl"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Conta */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Como você deseja usar o Pickup Brasil? *
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTipoConta('cliente')}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      formData.tipos_conta.includes('cliente')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.tipos_conta.includes('cliente')}
                        onCheckedChange={() => toggleTipoConta('cliente')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-slate-800">Cliente</h4>
                        </div>
                        <p className="text-sm text-slate-600">
                          Solicitar entregas, mudanças e fretes
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTipoConta('motorista')}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      formData.tipos_conta.includes('motorista')
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.tipos_conta.includes('motorista')}
                        onCheckedChange={() => toggleTipoConta('motorista')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-slate-800">Motorista</h4>
                        </div>
                        <p className="text-sm text-slate-600">
                          Realizar entregas e ganhar dinheiro
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={atualizarPerfilMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl h-12 text-base font-semibold"
              >
                {atualizarPerfilMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Suas informações são seguras e protegidas
        </p>
      </motion.div>
    </div>
  );
}