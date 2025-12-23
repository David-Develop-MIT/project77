import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Building2, Save, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DadosBancarios() {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    tipo_conta: 'corrente',
    banco: '',
    agencia: '',
    conta: '',
    digito: '',
    titular: '',
    cpf: '',
    pix_tipo: 'cpf',
    pix_chave: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: dados } = useQuery({
    queryKey: ['dados-bancarios', user?.email],
    queryFn: async () => {
      const todos = await base44.entities.DadosBancarios.list();
      return todos.find(d => d.motorista_email === user?.email);
    },
    enabled: !!user?.email
  });

  React.useEffect(() => {
    if (dados) {
      setFormData({
        tipo_conta: dados.tipo_conta || 'corrente',
        banco: dados.banco || '',
        agencia: dados.agencia || '',
        conta: dados.conta || '',
        digito: dados.digito || '',
        titular: dados.titular || '',
        cpf: dados.cpf || '',
        pix_tipo: dados.pix_tipo || 'cpf',
        pix_chave: dados.pix_chave || ''
      });
    }
  }, [dados]);

  const salvarMutation = useMutation({
    mutationFn: async (dadosBancarios) => {
      if (dados) {
        return await base44.entities.DadosBancarios.update(dados.id, dadosBancarios);
      } else {
        return await base44.entities.DadosBancarios.create({
          ...dadosBancarios,
          motorista_email: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dados-bancarios']);
      setEditando(false);
      toast.success('Dados bancários salvos!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.banco || !formData.agencia || !formData.conta || !formData.titular || !formData.cpf) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    salvarMutation.mutate(formData);
  };

  return (
    <Card className="border-slate-200 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Dados Bancários
          </CardTitle>
          {dados && !editando && (
            <div className="flex items-center gap-2">
              {dados.verificado && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditando(true)}
                className="rounded-lg"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!dados && !editando ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Cadastre seus dados bancários para receber pagamentos</p>
            <Button onClick={() => setEditando(true)} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
              Cadastrar Dados Bancários
            </Button>
          </div>
        ) : !editando ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Banco:</span>
                <p className="font-medium">{dados.banco}</p>
              </div>
              <div>
                <span className="text-slate-500">Tipo:</span>
                <p className="font-medium">{dados.tipo_conta === 'corrente' ? 'Corrente' : 'Poupança'}</p>
              </div>
              <div>
                <span className="text-slate-500">Agência:</span>
                <p className="font-medium">{dados.agencia}</p>
              </div>
              <div>
                <span className="text-slate-500">Conta:</span>
                <p className="font-medium">{dados.conta}-{dados.digito}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Titular:</span>
                <p className="font-medium">{dados.titular}</p>
              </div>
              {dados.pix_chave && (
                <div className="col-span-2">
                  <span className="text-slate-500">PIX ({dados.pix_tipo}):</span>
                  <p className="font-medium">{dados.pix_chave}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Conta *</Label>
                <Select value={formData.tipo_conta} onValueChange={(v) => setFormData({...formData, tipo_conta: v})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Input
                  value={formData.banco}
                  onChange={(e) => setFormData({...formData, banco: e.target.value})}
                  placeholder="Ex: 001 - Banco do Brasil"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Agência *</Label>
                <Input
                  value={formData.agencia}
                  onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                  placeholder="0000"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Conta *</Label>
                <Input
                  value={formData.conta}
                  onChange={(e) => setFormData({...formData, conta: e.target.value})}
                  placeholder="00000000"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Dígito</Label>
                <Input
                  value={formData.digito}
                  onChange={(e) => setFormData({...formData, digito: e.target.value})}
                  placeholder="0"
                  maxLength={1}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome do Titular *</Label>
              <Input
                value={formData.titular}
                onChange={(e) => setFormData({...formData, titular: e.target.value})}
                placeholder="Nome completo"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>CPF do Titular *</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                placeholder="000.000.000-00"
                className="rounded-xl"
              />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">Chave PIX (Opcional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Chave</Label>
                  <Select value={formData.pix_tipo} onValueChange={(v) => setFormData({...formData, pix_tipo: v})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.pix_chave}
                    onChange={(e) => setFormData({...formData, pix_chave: e.target.value})}
                    placeholder="Digite a chave"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {dados && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={salvarMutation.isPending}
                className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}