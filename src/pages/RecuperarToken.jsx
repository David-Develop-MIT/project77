import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecuperarToken() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor, preencha seu email');
      return;
    }

    setIsLoading(true);
    
    try {
      const usuarios = await base44.entities.UsuarioPickup.list();
      const usuario = usuarios.find(u => u.email === email);
      
      if (!usuario) {
        toast.error('Usuário não encontrado');
        setIsLoading(false);
        return;
      }

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Recuperação de Token - Pickup Brasil',
        body: `
          <h2>Recuperação de Token</h2>
          <p>Olá ${usuario.name},</p>
          <p>Você solicitou a recuperação do seu token de acesso.</p>
          <p><strong>Seu token de acesso:</strong></p>
          <h3 style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace;">${usuario.token_acesso}</h3>
          <p>Use este token para acessar sua conta.</p>
          <br>
          <p>Equipe Pickup Brasil</p>
        `
      });
      toast.success('Token enviado para seu email!');

    } catch (error) {
      toast.error('Erro ao recuperar token');
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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Recuperar Token</h1>
          <p className="text-slate-600">Informe seu email ou celular cadastrado</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Recuperação de Acesso</CardTitle>
            <CardDescription>Enviaremos seu token por email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Recuperando...
                  </>
                ) : (
                  'Recuperar Token'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem uma conta?{' '}
          <Link to={createPageUrl('CadastroTokenLogin')} className="text-emerald-600 hover:underline font-medium">
            Cadastre-se aqui
          </Link>
        </p>
      </motion.div>
    </div>
  );
}