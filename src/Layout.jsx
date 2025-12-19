import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, Package, Plus, Menu, X, LogOut, User, DollarSign, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/components/useNotifications';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Sistema de notificações em tempo real
  const { pedidosDisponiveis, hasNewNotifications } = useNotifications();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const alternarModoMutation = useMutation({
    mutationFn: (novoModo) => base44.auth.updateMe({ modo_ativo: novoModo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Modo alterado!');
      navigate(createPageUrl('Home'));
    }
  });

  // Redirecionar para escolha de perfil se necessário
  React.useEffect(() => {
    if (user && !user.tipos_conta?.length && location.pathname !== createPageUrl('EscolherPerfil')) {
      navigate(createPageUrl('EscolherPerfil'));
    }
  }, [user, location, navigate]);

  const modoAtivo = user?.modo_ativo || 'cliente';
  const temAmbos = user?.tipos_conta?.length > 1;

  const handleLogout = async () => {
    toast.success('Até logo!');
    setTimeout(async () => {
      await base44.auth.logout();
      base44.auth.redirectToLogin();
    }, 500);
  };

  const navItemsCliente = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Pedidos', icon: Package, page: 'MeusPedidos' },
    { name: 'Novo', icon: Plus, page: 'NovoPedido' },
    ...(user?.tipos_conta?.includes('motorista') ? [] : [{ name: 'Ser Motorista', icon: Truck, page: 'TornarseMotorista' }])
  ];

  const navItemsMotorista = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Disponíveis', icon: Package, page: 'PedidosDisponiveis' },
    { name: 'Minhas Entregas', icon: Truck, page: 'MeusPedidosMotorista' }
  ];

  const navItems = modoAtivo === 'motorista' ? navItemsMotorista : navItemsCliente;

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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">Entregas</span>
          </Link>
          <div className="flex items-center gap-2">
            {modoAtivo === 'motorista' && (
              <NotificationBell 
                count={pedidosDisponiveis.length}
                onClick={() => navigate(createPageUrl('PedidosDisponiveis'))}
              />
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b border-slate-100"
            >
              <nav className="p-4 space-y-2">
                {navItems.map(item => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.page) ? "default" : "ghost"}
                      className={`w-full justify-start rounded-xl ${
                        isActive(item.page) 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'text-slate-600'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
                ))}
                
                <div className="pt-2 border-t border-slate-100">
                  {user && (
                    <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {user.full_name || user.email}
                          </p>
                        </div>
                        <Badge className={modoAtivo === 'motorista' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                          {modoAtivo === 'motorista' ? '🚗' : '👤'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  )}
                  {temAmbos && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMenuOpen(false);
                        alternarModoMutation.mutate(modoAtivo === 'cliente' ? 'motorista' : 'cliente');
                      }}
                      className="w-full justify-start rounded-xl mb-2"
                      disabled={alternarModoMutation.isPending}
                    >
                      <RefreshCw className="w-5 h-5 mr-3" />
                      Modo {modoAtivo === 'cliente' ? 'Motorista' : 'Cliente'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair da Conta
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col p-4 z-50">
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">Entregas</span>
          </Link>
          {modoAtivo === 'motorista' && (
            <NotificationBell 
              count={pedidosDisponiveis.length}
              onClick={() => navigate(createPageUrl('PedidosDisponiveis'))}
            />
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <Button
                variant={isActive(item.page) ? "default" : "ghost"}
                className={`w-full justify-start rounded-xl h-11 ${
                  isActive(item.page) 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          {user && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user.full_name || user.email}
                  </p>
                </div>
                <Badge className={modoAtivo === 'motorista' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                  {modoAtivo === 'motorista' ? '🚗 Motorista' : '👤 Cliente'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          {temAmbos && (
            <Button
              variant="outline"
              onClick={() => alternarModoMutation.mutate(modoAtivo === 'cliente' ? 'motorista' : 'cliente')}
              className="w-full justify-start rounded-xl"
              disabled={alternarModoMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-3" />
              Alternar para {modoAtivo === 'cliente' ? 'Motorista' : 'Cliente'}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
          >
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
          {navItems.map(item => (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive(item.page) ? 'text-orange-500' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}