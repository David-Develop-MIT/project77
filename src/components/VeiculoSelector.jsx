import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, Car, Truck, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const veiculoIcons = {
  moto: Bike,
  carro: Car,
  van: Truck,
  caminhao: Package
};

const veiculoLabels = {
  moto: 'Moto',
  carro: 'Carro',
  van: 'Van',
  caminhao: 'Caminhão'
};

export default function VeiculoSelector({ value, onChange, motoristaId, label = "Veículo" }) {
  const { data: veiculos = [], isLoading } = useQuery({
    queryKey: ['veiculos-motorista', motoristaId],
    queryFn: async () => {
      const todos = await base44.entities.Veiculo.list('-created_date', 100);
      return todos.filter(v => v.motorista_id === motoristaId && v.ativo);
    },
    enabled: !!motoristaId
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (veiculos.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          Nenhum veículo cadastrado. Adicione veículos em "Meus Veículos".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Selecione o veículo" />
        </SelectTrigger>
        <SelectContent>
          {veiculos.map(veiculo => {
            const Icon = veiculoIcons[veiculo.tipo];
            return (
              <SelectItem key={veiculo.id} value={veiculo.id}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">{veiculo.placa}</span>
                    <span className="text-xs text-slate-500">
                      {veiculoLabels[veiculo.tipo]} - {veiculo.modelo}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}