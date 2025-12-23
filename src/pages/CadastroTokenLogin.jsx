import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CadastroTokenLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const gerarToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Por favor, preencha seu nome');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Por favor, preencha seu email');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Por favor, digite um email válido');
      return;
    }

    setIsLoading(true);
    
    try {
      // Verificar se já existe
      const usuarios = await base44.entities.UsuarioPickup.list();
      const usuarioExistente = usuarios.find(u => u.email === formData.email);
      
      if (usuarioExistente) {
        toast.error('Este email já está cadastrado');
        setIsLoading(false);
        return;
      }

      // Gerar token
      const token = gerarToken();

      // Criar usuário
      await base44.entities.UsuarioPickup.create({
        name: formData.nome,
        email: formData.email,
        token_acesso: token,
        ativo: true
      });

      // Enviar email com token
      await base44.integrations.Core.SendEmail({
        to: formData.email,
          subject: 'Seu Token de Acesso - Pickup Brasil',
          body: `
            <h2>Bem-vindo ao Pickup Brasil!</h2>
            <p>Olá ${formData.nome},</p>
            <p>Seu cadastro foi realizado com sucesso!</p>
            <p><strong>Seu token de acesso:</strong></p>
            <h3 style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace;">${token}</h3>
            <p>Use este token para acessar sua conta.</p>
            <p>Guarde-o em um lugar seguro!</p>
            <br>
            <p>Equipe Pickup Brasil</p>
          `
        });

      toast.success('Cadastro realizado! Verifique seu email.');
      
      setTimeout(() => {
        navigate(createPageUrl('TokenLogin'));
      }, 2000);

    } catch (error) {
      toast.error('Erro ao realizar cadastro');
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
        className="w-full max-w-md"
      >
        <Link to={createPageUrl('TokenLogin')}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Criar Conta</h1>
          <p className="text-slate-600">Cadastre-se para receber seu token de acesso</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Novo Cadastro</CardTitle>
            <CardDescription>Preencha os campos abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Seu nome
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite seu nome completo"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="exemplo@email.com"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Você receberá um token de acesso por email
        </p>
      </motion.div>
    </div>
  );
}