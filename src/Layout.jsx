import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, Package, Plus, Menu, X, LogOut, User, DollarSign, Truck, RefreshCw, MessageCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';
import AvaliacaoDisplay from '@/components/AvaliacaoDisplay';
import { useNotifications } from '@/components/useNotifications';
import NotificacaoAlocacao from '@/components/NotificacaoAlocacao';
import AtualizarLocalizacao from '@/components/AtualizarLocalizacao';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Sistema de notificações em tempo real
  const { totalNaoLidas, hasNewNotifications, NotificationSound } = useNotifications();

  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const usuarios = await base44.entities.UsuarioPickup.list();
      return usuarios.find(u => u.email === authUser.email);
    },
    enabled: !!authUser?.email,
    retry: false
  });

  const alternarModoMutation = useMutation({
    mutationFn: async (novoModo) => {
      if (!user?.id) return;
      await base44.entities.UsuarioPickup.update(user.id, { modo_ativo: novoModo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Modo alterado!');
      navigate(createPageUrl('Home'));
    }
  });

  // Redirecionar para completar perfil se necessário
  React.useEffect(() => {
    const perfilCompleto = user?.perfil_completo || user?.tipos_conta?.length > 0;

    if (user && !perfilCompleto && location.pathname !== createPageUrl('CompletarPerfilInicial')) {
      navigate(createPageUrl('CompletarPerfilInicial'));
    }
  }, [user, location, navigate]);

  const modoAtivo = user?.modo_ativo || 'cliente';
  const temAmbos = user?.tipos_conta?.length > 1;

  const handleLogout = async () => {
    toast.success('Até logo!');
    // Limpar dados salvos
    localStorage.removeItem('pickupLogin_email');
    localStorage.removeItem('pickupLogin_token');
    localStorage.removeItem('pickupLogin_credentialId');
    // Fazer logout do base44
    await base44.auth.logout(createPageUrl('TokenLogin'));
  };

  const navItemsCliente = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Pedidos', icon: Package, page: 'MeusPedidos' },
    { name: 'Novo', icon: Plus, page: 'NovoPedido' },
    { name: 'Chat', icon: MessageCircle, page: 'Chat' },
    { name: 'Carteira', icon: Wallet, page: 'Carteira' },
    { name: 'Perfil', icon: User, page: 'PerfilCliente' },
    ...((user?.tipos_conta && user.tipos_conta.includes('motorista')) ? [] : [{ name: 'Ser Motorista', icon: Truck, page: 'TornarseMotorista' }])
  ];


  const navItemsMotorista = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Disponíveis', icon: Package, page: 'PedidosDisponiveis' },
  { name: 'Entregas', icon: Truck, page: 'MeusPedidosMotorista' },
  { name: 'Veículos', icon: Truck, page: 'MeusVeiculos' },
  { name: 'Chat', icon: MessageCircle, page: 'Chat' },
  { name: 'Carteira', icon: Wallet, page: 'Carteira' },
  { name: 'Histórico', icon: Package, page: 'HistoricoEntregas' },
  { name: 'Perfil', icon: User, page: 'PerfilMotorista' }];


  const navItems = modoAtivo === 'motorista' ? navItemsMotorista : navItemsCliente;

  // Itens do menu mobile bottom nav (somente os principais)
  const navItemsMobileBottom = modoAtivo === 'motorista' 
    ? navItemsMotorista.filter(item => ['Home', 'Disponíveis', 'Entregas', 'Chat'].includes(item.name))
    : navItemsCliente;

  const isActive = (page) => {
    const pageUrl = createPageUrl(page);
    return location.pathname === pageUrl || location.pathname === pageUrl + '/';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-16">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="bg-emerald-800 rounded-xl w-9 h-9 from-orange-500 to-orange-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(0,300) scale(0.1,-0.1)" fill="white" stroke="none">
                  <path d="M660 1835 l0 -665 52 41 c99 78 218 127 478 200 63 17 133 40 155 50 50 24 86 75 93 134 l5 45 -122 0 c-66 0 -121 3 -121 6 0 6 429 494 435 494 2 0 88 -98 191 -217 103 -120 199 -231 213 -246 l26 -28 -37 16 c-53 22 -97 19 -156 -11 l-52 -26 0 -49 c0 -96 -53 -211 -127 -273 -45 -38 -85 -52 -293 -106 -305 -79 -408 -129 -502 -245 -26 -32 -62 -93 -80 -134 -30 -72 -32 -84 -36 -229 -4 -147 -3 -157 23 -230 15 -42 38 -98 51 -124 l24 -48 170 0 170 0 2 418 3 417 245 5 c234 5 251 7 374 38 178 45 286 101 386 202 134 134 200 299 200 494 0 130 -19 218 -70 322 -75 155 -229 289 -403 352 -164 59 -197 62 -773 62 l-524 0 0 -665z"/>
                </g>
              </svg>
            </div>
            <span className="font-bold text-slate-800">Pickup Brasil</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell
              count={totalNaoLidas}
              hasNew={hasNewNotifications}
              onClick={() => setNotificationPanelOpen(true)} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl">

              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {menuOpen &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-slate-100">

              <nav className="p-4 space-y-2">
                {navItems.map((item) =>
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMenuOpen(false)}>

                    <Button
                  variant={isActive(item.page) ? "default" : "ghost"}
                  className={`w-full justify-start rounded-xl ${
                  isActive(item.page) ?
                  'bg-orange-500 hover:bg-orange-600 text-white' :
                  'text-slate-600'}`
                  }>

                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
              )}
                
                <div className="pt-2 border-t border-slate-100">
                  {user &&
                  <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {user.name || user.email}
                            </p>
                          </div>
                          <Badge className={modoAtivo === 'motorista' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                            {modoAtivo === 'motorista' ? '🚗' : '👤'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {modoAtivo === 'motorista' && user.avaliacao_media_motorista &&
                  <div className="mt-2 pt-2 border-t border-slate-200">
                          <AvaliacaoDisplay
                      nota={user.avaliacao_media_motorista}
                      totalAvaliacoes={user.total_avaliacoes_motorista || 0}
                      size="sm" />

                        </div>
                  }
                      {modoAtivo === 'cliente' && user.avaliacao_media_cliente &&
                  <div className="mt-2 pt-2 border-t border-slate-200">
                          <AvaliacaoDisplay
                      nota={user.avaliacao_media_cliente}
                      totalAvaliacoes={user.total_avaliacoes_cliente || 0}
                      size="sm" />

                        </div>
                  }
                    </div>
                }
                  {temAmbos &&
                <Button
                  variant="outline"
                  onClick={() => {
                    setMenuOpen(false);
                    alternarModoMutation.mutate(modoAtivo === 'cliente' ? 'motorista' : 'cliente');
                  }}
                  className="w-full justify-start rounded-xl mb-2"
                  disabled={alternarModoMutation.isPending}>

                      <RefreshCw className="w-5 h-5 mr-3" />
                      Modo {modoAtivo === 'cliente' ? 'Motorista' : 'Cliente'}
                    </Button>
                }
                  <Button
                  variant="ghost"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl">

                    <LogOut className="w-5 h-5 mr-3" />
                    Sair da Conta
                  </Button>
                </div>
              </nav>
            </motion.div>
          }
        </AnimatePresence>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col p-4 z-50">
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="bg-emerald-700 rounded-xl w-10 h-10 from-orange-500 to-orange-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(0,300) scale(0.1,-0.1)" fill="white" stroke="none">
                  <path d="M660 1835 l0 -665 52 41 c99 78 218 127 478 200 63 17 133 40 155 50 50 24 86 75 93 134 l5 45 -122 0 c-66 0 -121 3 -121 6 0 6 429 494 435 494 2 0 88 -98 191 -217 103 -120 199 -231 213 -246 l26 -28 -37 16 c-53 22 -97 19 -156 -11 l-52 -26 0 -49 c0 -96 -53 -211 -127 -273 -45 -38 -85 -52 -293 -106 -305 -79 -408 -129 -502 -245 -26 -32 -62 -93 -80 -134 -30 -72 -32 -84 -36 -229 -4 -147 -3 -157 23 -230 15 -42 38 -98 51 -124 l24 -48 170 0 170 0 2 418 3 417 245 5 c234 5 251 7 374 38 178 45 286 101 386 202 134 134 200 299 200 494 0 130 -19 218 -70 322 -75 155 -229 289 -403 352 -164 59 -197 62 -773 62 l-524 0 0 -665z"/>
                </g>
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-800">Pickup Brasil</span>
          </Link>
          <NotificationBell
            count={totalNaoLidas}
            hasNew={hasNewNotifications}
            onClick={() => setNotificationPanelOpen(true)} />

        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) =>
          <Link key={item.page} to={createPageUrl(item.page)}>
              <Button
              variant={isActive(item.page) ? "default" : "ghost"}
              className={`w-full justify-start rounded-xl h-11 ${
              isActive(item.page) ?
              'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25' :
              'text-slate-600 hover:bg-slate-100'}`
              }>

                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          {user &&
              <div className="px-3 py-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {user.name || user.email}
                      </p>
                    </div>
                    <Badge className={modoAtivo === 'motorista' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                      {modoAtivo === 'motorista' ? '🚗 Motorista' : '👤 Cliente'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
              {modoAtivo === 'motorista' && user.avaliacao_media_motorista &&
            <div className="mt-2 pt-2 border-t border-slate-200">
                  <AvaliacaoDisplay
                nota={user.avaliacao_media_motorista}
                totalAvaliacoes={user.total_avaliacoes_motorista || 0}
                size="sm" />

                </div>
            }
              {modoAtivo === 'cliente' && user.avaliacao_media_cliente &&
            <div className="mt-2 pt-2 border-t border-slate-200">
                  <AvaliacaoDisplay
                nota={user.avaliacao_media_cliente}
                totalAvaliacoes={user.total_avaliacoes_cliente || 0}
                size="sm" />

                </div>
            }
            </div>
          }
          {temAmbos &&
          <Button
            variant="outline"
            onClick={() => alternarModoMutation.mutate(modoAtivo === 'cliente' ? 'motorista' : 'cliente')}
            className="w-full justify-start rounded-xl"
            disabled={alternarModoMutation.isPending}>

              <RefreshCw className="w-4 h-4 mr-3" />
              Alternar para {modoAtivo === 'cliente' ? 'Motorista' : 'Cliente'}
            </Button>
          }
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl">

            <LogOut className="w-4 h-4 mr-3" />
            Sair da Conta
          </Button>
          <p className="text-xs text-slate-400 text-center">
            © 2024 Sistema de Entregas
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-100">
        <div className="flex items-center justify-around h-16 px-4">
          {navItemsMobileBottom.map((item) =>
          <Link key={item.page} to={createPageUrl(item.page)}>
              <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isActive(item.page) ? 'text-orange-500' : 'text-slate-400'}`
              }>

                <item.icon className="bg-transparent lucide lucide-house w-5 h-5" />
                <span className="text-green-700 text-xs font-medium">{item.name}</span>
              </motion.div>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)} />


      {/* Notificação de Alocação Automática (apenas para motoristas) */}
      {modoAtivo === 'motorista' && <NotificacaoAlocacao />}

      {/* Atualização de Localização em Background (apenas para motoristas) */}
      {modoAtivo === 'motorista' && <AtualizarLocalizacao />}

      {/* Som de Notificação */}
      <NotificationSound />
    </div>);

}