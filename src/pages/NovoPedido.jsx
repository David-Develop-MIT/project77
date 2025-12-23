import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, User, Phone, Calendar, Clock, FileText, Send, Loader2, DollarSign, CheckCircle2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ServiceCard from '@/components/ServiceCard';
import EnderecoAutocomplete from '@/components/EnderecoAutocomplete';
import PaymentMethodCard from '@/components/PaymentMethodCard';
import { servicoConfig } from '@/components/servicoConfig';
import { calcularDistanciaEPreco } from '@/components/CalculadoraDistancia';
import { toast } from 'sonner';

export default function NovoPedido() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tipoInicial = urlParams.get('tipo');
  
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [calculando, setCalculando] = useState(false);
  const [formData, setFormData] = useState({
    tipo_servico: tipoInicial || '',
    nome_cliente: '',
    telefone_cliente: '',
    cep_origem: '',
    endereco_origem: '',
    numero_origem: '',
    complemento_origem: '',
    latitude_origem: null,
    longitude_origem: null,
    cep_destino: '',
    endereco_destino: '',
    numero_destino: '',
    complemento_destino: '',
    latitude_destino: null,
    longitude_destino: null,
    distancia_km: null,
    tempo_estimado: null,
    valor_calculado: null,
    data_agendada: '',
    horario: '',
    descricao: '',
    observacoes: '',
    valor_total: null,
    metodo_pagamento: '',
    status_pagamento: 'pendente',
    status: 'pendente'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: precos = [] } = useQuery({
    queryKey: ['precos'],
    queryFn: () => base44.entities.TabelaPreco.list()
  });

  // Preencher dados do usuário automaticamente
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nome_cliente: user.full_name || '',
        telefone_cliente: user.telefone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (tipoInicial && servicoConfig[tipoInicial]) {
      setStep(2);
    }
  }, [tipoInicial]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const pedido = await base44.entities.Pedido.create(data);
      
      // Se for cartão de crédito/débito, redirecionar para checkout do Stripe
      if (data.metodo_pagamento === 'cartao_credito' || data.metodo_pagamento === 'cartao_debito') {
        const { data: checkoutData } = await base44.functions.invoke('criarCheckoutStripe', {
          pedido_id: pedido.id,
          valor: data.valor_total,
          metodo_pagamento: data.metodo_pagamento
        });
        
        if (checkoutData.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return pedido;
        }
      }
      
      // Para outros métodos (PIX, dinheiro), continuar normalmente
      // Tentar alocar automaticamente
      try {
        await base44.functions.invoke('alocarPedido', { pedido_id: pedido.id });
      } catch (error) {
        console.error('Erro ao alocar pedido:', error);
      }
      
      return pedido;
    },
    onSuccess: (pedido) => {
      if (formData.metodo_pagamento === 'cartao_credito' || formData.metodo_pagamento === 'cartao_debito') {
        // Não mostrar toast, pois será redirecionado
        return;
      }
      toast.success('Pedido criado! Buscando motorista disponível...');
      navigate(createPageUrl('MeusPedidos'));
    },
    onError: () => {
      toast.error('Erro ao criar pedido. Tente novamente.');
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTelefoneChange = (value) => {
    let telefone = value.replace(/\D/g, '');
    
    if (telefone.length > 11) telefone = telefone.slice(0, 11);
    
    if (telefone.length > 10) {
      telefone = telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (telefone.length > 6) {
      telefone = telefone.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (telefone.length > 2) {
      telefone = telefone.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (telefone.length > 0) {
      telefone = telefone.replace(/^(\d*)$/, '($1');
    }
    
    handleChange('telefone_cliente', telefone);
  };

  const handleServiceSelect = (tipo) => {
    handleChange('tipo_servico', tipo);
    setStep(2);
  };

  const calcularPreco = async () => {
    if (!formData.tipo_servico || !formData.latitude_origem || !formData.longitude_origem) {
      return;
    }

    if (!needsDestination || (!formData.latitude_destino || !formData.longitude_destino)) {
      const tabelaPreco = precos.find(p => p.tipo_servico === formData.tipo_servico && p.ativo);
      if (tabelaPreco) {
        setFormData(prev => ({
          ...prev,
          distancia_km: 0,
          tempo_estimado: 'N/A',
          valor_calculado: tabelaPreco.valor_minimo,
          valor_total: tabelaPreco.valor_minimo
        }));
      }
      return;
    }

    setCalculando(true);
    toast.loading('Calculando distância e preço...', { id: 'calc' });

    try {
      // Usar OSRM para calcular rota e distância
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${formData.longitude_origem},${formData.latitude_origem};${formData.longitude_destino},${formData.latitude_destino}?overview=false`
      );
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        toast.error('Não foi possível calcular a rota', { id: 'calc' });
        return;
      }

      const distanciaKm = (data.routes[0].distance / 1000).toFixed(2);
      const duracaoMinutos = Math.round(data.routes[0].duration / 60);
      const tempoEstimado = `${duracaoMinutos} min`;

      // Calcular preço
      const tabelaPreco = precos.find(p => p.tipo_servico === formData.tipo_servico && p.ativo);
      let valorCalculado = 0;

      if (tabelaPreco) {
        const kmExcedente = Math.max(0, distanciaKm - (tabelaPreco.km_inicial_incluido || 0));
        valorCalculado = tabelaPreco.valor_minimo + (kmExcedente * tabelaPreco.valor_por_km);
      }

      setFormData(prev => ({
        ...prev,
        distancia_km: parseFloat(distanciaKm),
        tempo_estimado: tempoEstimado,
        valor_calculado: valorCalculado,
        valor_total: valorCalculado
      }));
      toast.success('Preço calculado com sucesso!', { id: 'calc' });
    } catch (error) {
      toast.error('Erro ao calcular preço', { id: 'calc' });
    } finally {
      setCalculando(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.nome_cliente || !formData.telefone_cliente || !formData.endereco_origem || !formData.numero_origem) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!formData.metodo_pagamento) {
      toast.error('Selecione um método de pagamento');
      return;
    }
    if (!formData.valor_total || formData.valor_total <= 0) {
      toast.error('Informe o valor do serviço');
      return;
    }
    createMutation.mutate(formData);
  };

  const needsDestination = ['motoboy', 'carreto', 'mudanca', 'comida', 'frete'].includes(formData.tipo_servico);

  // Auto-calcular quando mudar de step 2 para 3
  const handleContinueToStep3 = async () => {
    if (!formData.valor_calculado && formData.endereco_origem && formData.numero_origem) {
      await calcularPreco();
    }
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => step > 1 ? setStep(step - 1) : navigate(createPageUrl('Home'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Novo Pedido</h1>
            <p className="text-slate-500">
              {step === 1 ? 'Selecione o tipo de serviço' : 
               step === 2 ? 'Informações do cliente' : 
               step === 3 ? 'Detalhes do serviço' : 'Pagamento'}
            </p>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-orange-500' : 'bg-slate-200'
              }`} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 - Service Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Object.entries(servicoConfig).map(([key, config]) => (
                <ServiceCard
                  key={key}
                  icon={config.icon}
                  title={config.title}
                  description={config.description}
                  color={config.color}
                  selected={formData.tipo_servico === key}
                  onClick={() => handleServiceSelect(key)}
                />
              ))}
            </motion.div>
          )}

          {/* Step 2 - Client Info */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Informações do Cliente</h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      Nome completo *
                    </Label>
                    <Input
                      placeholder="Digite o nome"
                      value={formData.nome_cliente}
                      onChange={(e) => handleChange('nome_cliente', e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Telefone *
                    </Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.telefone_cliente}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      maxLength={15}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <EnderecoAutocomplete
                  label="Endereço de Origem"
                  placeholder="Digite o endereço de coleta..."
                  onSelectAddress={(address) => {
                    setFormData(prev => ({
                      ...prev,
                      endereco_origem: address.endereco,
                      numero_origem: address.numero,
                      cep_origem: address.cep,
                      latitude_origem: address.latitude,
                      longitude_origem: address.longitude
                    }));
                  }}
                  color="text-emerald-500"
                  required={true}
                />

                {formData.endereco_origem && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Número *"
                      value={formData.numero_origem}
                      onChange={(e) => handleChange('numero_origem', e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Complemento"
                      value={formData.complemento_origem}
                      onChange={(e) => handleChange('complemento_origem', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}

                {needsDestination && (
                  <>
                    <EnderecoAutocomplete
                      label="Endereço de Destino"
                      placeholder="Digite o endereço de entrega..."
                      onSelectAddress={(address) => {
                        setFormData(prev => ({
                          ...prev,
                          endereco_destino: address.endereco,
                          numero_destino: address.numero,
                          cep_destino: address.cep,
                          latitude_destino: address.latitude,
                          longitude_destino: address.longitude
                        }));
                      }}
                      color="text-orange-500"
                      required={false}
                    />

                    {formData.endereco_destino && (
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Número"
                          value={formData.numero_destino}
                          onChange={(e) => handleChange('numero_destino', e.target.value)}
                          className="rounded-xl"
                        />
                        <Input
                          placeholder="Complemento"
                          value={formData.complemento_destino}
                          onChange={(e) => handleChange('complemento_destino', e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    onClick={calcularPreco}
                    disabled={!formData.latitude_origem || calculando}
                    variant="outline"
                    className="rounded-xl"
                  >
                    {calculando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 mr-2" />
                        Calcular Distância
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleContinueToStep3}
                    disabled={!formData.nome_cliente || !formData.telefone_cliente || !formData.endereco_origem || calculando}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
                  >
                    {calculando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 - Service Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Detalhes do Serviço</h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Data do serviço
                    </Label>
                    <Input
                      type="date"
                      value={formData.data_agendada}
                      onChange={(e) => handleChange('data_agendada', e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Horário preferido
                    </Label>
                    <Input
                      type="time"
                      value={formData.horario}
                      onChange={(e) => handleChange('horario', e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Descrição do serviço
                  </Label>
                  <Textarea
                    placeholder="Descreva o que precisa ser transportado ou entregue..."
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Observações adicionais</Label>
                  <Textarea
                    placeholder="Informações extras, como pontos de referência, horários específicos, etc."
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4 - Payment */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Pagamento</h2>
              
              <div className="space-y-6">
                {/* Distância e Cálculo */}
                {formData.distancia_km !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Distância</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formData.distancia_km} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Tempo Estimado</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {formData.tempo_estimado}
                        </p>
                      </div>
                    </div>
                    {formData.valor_calculado && (
                      <div className="pt-3 border-t border-blue-300">
                        <p className="text-xs text-blue-600 mb-1">Valor Calculado</p>
                        <p className="text-2xl font-bold text-blue-700">
                          R$ {formData.valor_calculado.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Valor */}
                <div className="space-y-2">
                  <Label className="text-slate-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Valor do serviço *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={formData.valor_total || ''}
                      onChange={(e) => handleChange('valor_total', parseFloat(e.target.value))}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 pl-12 text-lg font-semibold"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formData.valor_calculado ? 'Valor calculado automaticamente (pode ser ajustado)' : 'Informe o valor total do serviço'}
                  </p>
                </div>

                {/* Métodos de Pagamento */}
                <div className="space-y-3">
                  <Label className="text-slate-700">
                    Método de Pagamento *
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'].map((method) => (
                      <PaymentMethodCard
                        key={method}
                        method={method}
                        selected={formData.metodo_pagamento === method}
                        onClick={() => handleChange('metodo_pagamento', method)}
                      />
                    ))}
                  </div>
                </div>

                {/* Resumo */}
                {formData.valor_total > 0 && formData.metodo_pagamento && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-700 font-medium">Total a pagar</span>
                      <span className="text-2xl font-bold text-orange-600">
                        R$ {formData.valor_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      <span>
                        Pagamento via {formData.metodo_pagamento === 'pix' ? 'PIX' : 
                          formData.metodo_pagamento === 'cartao_credito' ? 'Cartão de Crédito' :
                          formData.metodo_pagamento === 'cartao_debito' ? 'Cartão de Débito' : 'Dinheiro'}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !formData.valor_total || !formData.metodo_pagamento}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-6 shadow-lg shadow-orange-500/25"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Confirmar Pedido
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}