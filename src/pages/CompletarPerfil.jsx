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
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    cep: '',
    numero: '',
    complemento: '',
    tipos_conta: []
  });

  const [buscandoCep, setBuscandoCep] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          pais: 'Brasil'
        }));
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length > 8) valor = valor.slice(0, 8);
    
    if (valor.length > 5) {
      valor = valor.slice(0, 5) + '-' + valor.slice(5);
    }
    
    setFormData(prev => ({ ...prev, cep: valor }));
    
    if (valor.replace(/\D/g, '').length === 8) {
      buscarCep(valor);
    }
  };

  const handleTelefoneChange = (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length > 11) valor = valor.slice(0, 11);
    
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d*)$/, '($1');
    }
    
    setFormData(prev => ({ ...prev, telefone: valor }));
  };

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

    if (!formData.telefone.trim() || formData.telefone.replace(/\D/g, '').length < 10) {
      toast.error('Por favor, preencha um telefone válido');
      return;
    }

    if (!formData.cep.trim() || formData.cep.replace(/\D/g, '').length !== 8) {
      toast.error('Por favor, preencha um CEP válido');
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
    setFormData((prev) => {
      const tipos = prev.tipos_conta.includes(tipo) ?
      prev.tipos_conta.filter((t) => t !== tipo) :
      [...prev.tipos_conta, tipo];
      return { ...prev, tipos_conta: tipos };
    });
  };

  React.useEffect(() => {
    if (user?.full_name) {
      setFormData((prev) => ({ ...prev, full_name: user.full_name }));
    }
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0,300) scale(0.1,-0.1)" fill="white" stroke="none">
                <path d="M660 1835 l0 -665 52 41 c99 78 218 127 478 200 63 17 133 40 155 50 50 24 86 75 93 134 l5 45 -122 0 c-66 0 -121 3 -121 6 0 6 429 494 435 494 2 0 88 -98 191 -217 103 -120 199 -231 213 -246 l26 -28 -37 16 c-53 22 -97 19 -156 -11 l-52 -26 0 -49 c0 -96 -53 -211 -127 -273 -45 -38 -85 -52 -293 -106 -305 -79 -408 -129 -502 -245 -26 -32 -62 -93 -80 -134 -30 -72 -32 -84 -36 -229 -4 -147 -3 -157 23 -230 15 -42 38 -98 51 -124 l24 -48 170 0 170 0 2 418 3 417 245 5 c234 5 251 7 374 38 178 45 286 101 386 202 134 134 200 299 200 494 0 130 -19 218 -70 322 -75 155 -229 289 -403 352 -164 59 -197 62 -773 62 l-524 0 0 -665z"/>
              </g>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo ao Pickup

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
                    onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="rounded-xl"
                    required />

                </div>

                <div>
                  <Label htmlFor="telefone" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    Telefone *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(00) 00000-0000"
                    className="rounded-xl"
                    maxLength={15}
                    required />

                </div>
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h3>
                <div className="grid gap-4">
                  <div className="relative">
                    <Input
                      placeholder="CEP"
                      value={formData.cep}
                      onChange={handleCepChange}
                      className="rounded-xl"
                      maxLength={9}
                      required
                    />
                    {buscandoCep && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-slate-400" />
                    )}
                  </div>
                  
                  <Input
                    placeholder="Endereço"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    className="rounded-xl"
                    readOnly={buscandoCep}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Número"
                      value={formData.numero}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  <Input
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    className="rounded-xl"
                    readOnly={buscandoCep}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      className="rounded-xl"
                      readOnly={buscandoCep}
                    />
                    <Input
                      placeholder="Estado"
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      className="rounded-xl"
                      maxLength={2}
                      readOnly={buscandoCep}
                    />
                  </div>

                  <Input
                    placeholder="País"
                    value={formData.pais}
                    onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                    className="rounded-xl"
                    readOnly
                  />
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
                    formData.tipos_conta.includes('cliente') ?
                    'border-blue-500 bg-blue-50' :
                    'border-slate-200 bg-white hover:border-slate-300'}`
                    }>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.tipos_conta.includes('cliente')}
                        onCheckedChange={() => toggleTipoConta('cliente')}
                        className="mt-1" />

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
                    formData.tipos_conta.includes('motorista') ?
                    'border-orange-500 bg-orange-50' :
                    'border-slate-200 bg-white hover:border-slate-300'}`
                    }>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.tipos_conta.includes('motorista')}
                        onCheckedChange={() => toggleTipoConta('motorista')}
                        className="mt-1" />

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
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl h-12 text-base font-semibold">

                {atualizarPerfilMutation.isPending ?
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </> :

                <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Suas informações são seguras e protegidas
        </p>
      </motion.div>
    </div>);

}