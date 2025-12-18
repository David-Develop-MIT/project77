import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Plus, Search, Bike, Car, Truck, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const veiculoIcons = {
  moto: Bike,
  carro: Car,
  van: Truck,
  caminhao: Truck
};

const veiculoLabels = {
  moto: 'Moto',
  carro: 'Carro',
  van: 'Van',
  caminhao: 'Caminhão'
};

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  ocupado: { label: 'Ocupado', color: 'bg-amber-100 text-amber-700' },
  inativo: { label: 'Inativo', color: 'bg-slate-100 text-slate-700' }
};

export default function Motoristas() {
  const [busca, setBusca] = useState('');

  const { data: motoristas = [], isLoading } = useQuery({
    queryKey: ['motoristas'],
    queryFn: () => base44.entities.Motorista.list('-created_date', 100)
  });

  const motoristasFiltrados = motoristas.filter(m => 
    !busca || 
    m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    m.telefone?.includes(busca) ||
    m.veiculo_placa?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Motoristas</h1>
            <p className="text-slate-500">{motoristas.length} motoristas cadastrados</p>
          </div>
          <Link to={createPageUrl('NovoMotorista')}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Novo Motorista
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, telefone ou placa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : motoristasFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">
              {busca ? 'Nenhum motorista encontrado' : 'Nenhum motorista cadastrado'}
            </h3>
            <p className="text-slate-500 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Adicione seu primeiro motorista'}
            </p>
            {!busca && (
              <Link to={createPageUrl('NovoMotorista')}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Motorista
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {motoristasFiltrados.map((motorista, index) => {
              const VeiculoIcon = veiculoIcons[motorista.veiculo_tipo] || Car;
              const statusInfo = statusConfig[motorista.status] || statusConfig.disponivel;

              return (
                <motion.div
                  key={motorista.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`${createPageUrl('DetalheMotorista')}?id=${motorista.id}`}>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
                          {motorista.nome?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">{motorista.nome}</h3>
                          <Badge className={`${statusInfo.color} mt-1`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{motorista.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <VeiculoIcon className="w-4 h-4 text-slate-400" />
                          <span>{veiculoLabels[motorista.veiculo_tipo]} - {motorista.veiculo_placa || 'Sem placa'}</span>
                        </div>
                        {motorista.veiculo_modelo && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{motorista.veiculo_modelo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}