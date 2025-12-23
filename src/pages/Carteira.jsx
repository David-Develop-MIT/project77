import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, DollarSign, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GerenciarCartoes from '@/components/pagamentos/GerenciarCartoes';
import HistoricoTransacoes from '@/components/pagamentos/HistoricoTransacoes';
import FaturasMotorista from '@/components/pagamentos/FaturasMotorista';
import DadosBancarios from '@/components/pagamentos/DadosBancarios';

export default function Carteira() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isMotorista = user?.tipos_conta?.includes('motorista');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Carteira</h1>
              <p className="text-slate-500">Gerencie seus pagamentos e ganhos</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="metodos" className="space-y-6">
          <TabsList className={`grid w-full ${isMotorista ? 'grid-cols-4' : 'grid-cols-2'} rounded-xl`}>
            <TabsTrigger value="metodos" className="rounded-lg">
              <Wallet className="w-4 h-4 mr-2" />
              Métodos
            </TabsTrigger>
            <TabsTrigger value="transacoes" className="rounded-lg">
              <Receipt className="w-4 h-4 mr-2" />
              Transações
            </TabsTrigger>
            {isMotorista && (
              <>
                <TabsTrigger value="faturas" className="rounded-lg">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Faturas
                </TabsTrigger>
                <TabsTrigger value="bancarios" className="rounded-lg">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Dados Bancários
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="metodos">
            <GerenciarCartoes />
          </TabsContent>

          <TabsContent value="transacoes">
            <HistoricoTransacoes />
          </TabsContent>

          {isMotorista && (
            <>
              <TabsContent value="faturas">
                <FaturasMotorista />
              </TabsContent>
              <TabsContent value="bancarios">
                <DadosBancarios />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}