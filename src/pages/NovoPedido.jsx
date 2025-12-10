import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, User, Phone, Calendar, Clock, FileText, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ServiceCard from '@/components/ServiceCard';
import { servicoConfig } from '@/components/servicoConfig';
import { toast } from 'sonner';

export default function NovoPedido() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tipoInicial = urlParams.get('tipo');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo_servico: tipoInicial || '',
    nome_cliente: '',
    telefone_cliente: '',
    endereco_origem: '',
    endereco_destino: '',
    data_agendada: '',
    horario: '',
    descricao: '',
    observacoes: '',
    valor_estimado: null,
    status: 'pendente'
  });

  useEffect(() => {
    if (tipoInicial && servicoConfig[tipoInicial]) {
      setStep(2);
    }
  }, [tipoInicial]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pedido.create(data),
    onSuccess: () => {
      toast.success('Pedido criado com sucesso!');
      navigate(createPageUrl('MeusPedidos'));
    },
    onError: () => {
      toast.error('Erro ao criar pedido. Tente novamente.');
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (tipo) => {
    handleChange('tipo_servico', tipo);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!formData.nome_cliente || !formData.telefone_cliente || !formData.endereco_origem) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate(formData);
  };

  const needsDestination = ['motoboy', 'carreto', 'mudanca', 'comida', 'frete'].includes(formData.tipo_servico);

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
               step === 2 ? 'Informações do cliente' : 'Detalhes do serviço'}
            </p>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
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
                      onChange={(e) => handleChange('telefone_cliente', e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Endereço de origem *
                  </Label>
                  <Input
                    placeholder="Rua, número, bairro, cidade"
                    value={formData.endereco_origem}
                    onChange={(e) => handleChange('endereco_origem', e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {needsDestination && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      Endereço de destino
                    </Label>
                    <Input
                      placeholder="Rua, número, bairro, cidade"
                      value={formData.endereco_destino}
                      onChange={(e) => handleChange('endereco_destino', e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!formData.nome_cliente || !formData.telefone_cliente || !formData.endereco_origem}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
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
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
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
                        Criar Pedido
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