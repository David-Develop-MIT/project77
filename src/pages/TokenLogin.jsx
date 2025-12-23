import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Key, Loader2, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TokenLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    tokenAcesso: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Carregar dados salvos
    const savedEmail = localStorage.getItem('pickupLogin_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }

    // Verificar disponibilidade de biometria
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setBiometricAvailable(available);
        });
    }
  }, []);

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem('pickupLogin_email');
    const savedCredentialId = localStorage.getItem('pickupLogin_credentialId');

    if (!savedEmail || !savedCredentialId) {
      toast.error('Configure o login biométrico primeiro');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: Uint8Array.from(atob(savedCredentialId), c => c.charCodeAt(0)),
            type: 'public-key'
          }],
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (credential) {
        const savedToken = localStorage.getItem('pickupLogin_token');
        if (savedToken) {
          setFormData({ email: savedEmail, tokenAcesso: savedToken });
          toast.success('Autenticado com biometria!');
          setTimeout(() => navigate(createPageUrl('Home')), 500);
        }
      }
    } catch (error) {
      toast.error('Falha na autenticação biométrica');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Por favor, preencha seu email');
      return;
    }

    if (!formData.tokenAcesso.trim()) {
      toast.error('Por favor, preencha o token de acesso');
      return;
    }

    setIsLoading(true);
    
    try {
      const usuarios = await base44.entities.UsuarioPickup.list();
      const usuario = usuarios.find(
        u => u.email === formData.email && u.token_acesso === formData.tokenAcesso
      );

      if (!usuario) {
        toast.error('Credenciais inválidas');
        setIsLoading(false);
        return;
      }

      if (!usuario.ativo) {
        toast.error('Usuário inativo');
        setIsLoading(false);
        return;
      }

      // Atualizar último acesso
      await base44.entities.UsuarioPickup.update(usuario.id, {
        ultimo_acesso: new Date().toISOString()
      });

      // Salvar dados localmente
      localStorage.setItem('pickupLogin_email', formData.email);
      localStorage.setItem('pickupLogin_token', formData.tokenAcesso);

      // Configurar biometria se disponível e primeira vez
      const hasCredential = localStorage.getItem('pickupLogin_credentialId');
      if (biometricAvailable && !hasCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: challenge,
              rp: { name: 'Pickup Brasil' },
              user: {
                id: userId,
                name: formData.email,
                displayName: usuario.name || formData.email
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
              timeout: 60000,
              attestation: 'none',
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required'
              }
            }
          });

          if (credential) {
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem('pickupLogin_credentialId', credentialId);
            toast.success('Biometria configurada!');
          }
        } catch (error) {
          console.log('Biometria não configurada:', error);
        }
      }

      // Verificar se precisa completar perfil
      const users = await base44.entities.User.list();
      const userRecord = users.find(u => u.email === usuario.email);
      
      if (!userRecord || !userRecord.perfil_completo) {
        toast.success('Complete seu perfil para continuar');
        setTimeout(() => navigate(createPageUrl('CompletarPerfilInicial')), 500);
        return;
      }

      toast.success('Login realizado com sucesso!');
      setTimeout(() => navigate(createPageUrl('Home')), 500);

    } catch (error) {
      toast.error('Erro ao autenticar');
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Identifique-se</h1>
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

              {biometricAvailable && localStorage.getItem('pickupLogin_credentialId') && (
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  variant="outline"
                  className="w-full rounded-xl h-12 text-base font-semibold"
                >
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Entrar com Biometria
                </Button>
              )}
            </form>

            <div className="mt-4 space-y-2">
              <Link to={createPageUrl('RecuperarToken')}>
                <Button variant="link" className="w-full text-sm text-slate-600">
                  Esqueceu seu token?
                </Button>
              </Link>
              <Link to={createPageUrl('CadastroTokenLogin')}>
                <Button variant="link" className="w-full text-sm text-emerald-600 font-medium">
                  Não tem uma conta? Cadastre-se
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Suas informações são seguras e protegidas
        </p>
      </motion.div>
    </div>
  );
}