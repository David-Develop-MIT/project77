import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TokenLogin() {
  const [formData, setFormData] = useState({
    emailOuCelular: '',
    tokenAcesso: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.emailOuCelular.trim()) {
      toast.error('Por favor, preencha seu email ou celular');
      return;
    }

    if (!formData.tokenAcesso.trim()) {
      toast.error('Por favor, preencha o token de acesso');
      return;
    }

    setIsLoading(true);
    
    // Aqui você pode adicionar a lógica de autenticação
    try {
      // Simulação de chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Autenticação realizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao autenticar. Tente novamente.');
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Acesso com Token</h1>
          <p className="text-slate-600">Entre com suas credenciais de acesso</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Autenticação</CardTitle>
            <CardDescription>Preencha os campos abaixo para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="emailOuCelular" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Seu email ou celular
                </Label>
                <Input
                  id="emailOuCelular"
                  type="text"
                  value={formData.emailOuCelular}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailOuCelular: e.target.value }))}
                  placeholder="exemplo@email.com ou (00) 00000-0000"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tokenAcesso" className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-slate-500" />
                  Token de acesso
                </Label>
                <Input
                  id="tokenAcesso"
                  type="password"
                  value={formData.tokenAcesso}
                  onChange={(e) => setFormData(prev => ({ ...prev, tokenAcesso: e.target.value }))}
                  placeholder="Digite seu token de acesso"
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
                    Autenticando...
                  </>
                ) : (
                  'Entrar'
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