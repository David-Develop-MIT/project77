import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function GerenciarCartoes() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: ''
  });
  const [bandeiraDetectada, setBandeiraDetectada] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: cartoes = [] } = useQuery({
    queryKey: ['metodos-pagamento', user?.email],
    queryFn: async () => {
      const todos = await base44.entities.MetodoPagamento.list('-created_date', 50);
      return todos.filter(c => c.usuario_email === user?.email);
    },
    enabled: !!user?.email
  });

  const adicionarMutation = useMutation({
    mutationFn: async (dados) => {
      // Simular integração com Stripe (em produção, usar Stripe Elements)
      const ultimosDigitos = dados.numero.slice(-4);
      const bandeira = detectarBandeira(dados.numero);

      return await base44.entities.MetodoPagamento.create({
        usuario_email: user.email,
        tipo: 'cartao_credito',
        ultimos_digitos: ultimosDigitos,
        bandeira,
        nome_titular: dados.nome,
        validade: dados.validade,
        stripe_payment_method_id: `pm_${Date.now()}`, // Simulado
        padrao: cartoes.length === 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pagamento']);
      setMostrarForm(false);
      setFormData({ numero: '', nome: '', validade: '', cvv: '' });
      toast.success('Cartão adicionado com sucesso!');
    }
  });

  const removerMutation = useMutation({
    mutationFn: (id) => base44.entities.MetodoPagamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pagamento']);
      toast.success('Cartão removido');
    }
  });

  const definirPadraoMutation = useMutation({
    mutationFn: async (id) => {
      // Remover padrão de todos
      await Promise.all(
        cartoes.map(c => base44.entities.MetodoPagamento.update(c.id, { padrao: false }))
      );
      // Definir novo padrão
      await base44.entities.MetodoPagamento.update(id, { padrao: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pagamento']);
      toast.success('Cartão padrão atualizado');
    }
  });

  const detectarBandeira = (numero) => {
    const limpo = numero.replace(/\s/g, '');
    if (limpo.startsWith('4')) return 'Visa';
    if (limpo.startsWith('5')) return 'Mastercard';
    if (limpo.startsWith('37') || limpo.startsWith('34')) return 'Amex';
    if (limpo.startsWith('6')) return 'Elo';
    return '';
  };

  const handleNumeroChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 16) value = value.slice(0, 16);
    
    // Aplicar máscara: 0000 0000 0000 0000
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    
    setFormData({...formData, numero: formatted});
    
    // Detectar bandeira em tempo real
    const bandeira = detectarBandeira(value);
    setBandeiraDetectada(bandeira);
  };

  const handleValidadeChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 4) value = value.slice(0, 4);
    
    // Aplicar máscara: MM/AA
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setFormData({...formData, validade: value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.numero || !formData.nome || !formData.validade || !formData.cvv) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    // Validar validade
    const [mes, ano] = formData.validade.split('/');
    if (!mes || !ano || parseInt(mes) > 12 || parseInt(mes) < 1) {
      toast.error('Validade inválida');
      return;
    }
    
    adicionarMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Métodos de Pagamento</h3>
        {!mostrarForm && (
          <Button
            onClick={() => setMostrarForm(true)}
            className="bg-blue-500 hover:bg-blue-600 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cartão
          </Button>
        )}
      </div>

      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-200 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Novo Cartão</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Número do Cartão</Label>
                    <div className="relative">
                      <Input
                        value={formData.numero}
                        onChange={handleNumeroChange}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="rounded-xl pr-20"
                      />
                      {bandeiraDetectada && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            {bandeiraDetectada}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Nome do Titular</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Como está no cartão"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade</Label>
                      <Input
                        value={formData.validade}
                        onChange={handleValidadeChange}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        value={formData.cvv}
                        onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                        placeholder="123"
                        maxLength={4}
                        type="password"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMostrarForm(false)}
                      className="flex-1 rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={adicionarMutation.isPending}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-xl"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2">
        {cartoes.map((cartao) => (
          <motion.div
            key={cartao.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-slate-200 rounded-2xl hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{cartao.bandeira}</p>
                      <p className="text-sm text-slate-500">•••• {cartao.ultimos_digitos}</p>
                    </div>
                  </div>
                  {cartao.padrao && (
                    <Badge className="bg-green-100 text-green-700">Padrão</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!cartao.padrao && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => definirPadraoMutation.mutate(cartao.id)}
                      disabled={definirPadraoMutation.isPending}
                      className="flex-1 rounded-lg"
                    >
                      Definir como Padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerMutation.mutate(cartao.id)}
                    disabled={removerMutation.isPending}
                    className="text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {cartoes.length === 0 && !mostrarForm && (
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Nenhum cartão cadastrado</p>
            <Button
              onClick={() => setMostrarForm(true)}
              className="bg-blue-500 hover:bg-blue-600 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}