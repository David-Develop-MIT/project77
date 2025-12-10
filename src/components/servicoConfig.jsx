import { Bike, Truck, Home, Construction, UtensilsCrossed, Package } from 'lucide-react';

export const servicoConfig = {
  motoboy: {
    icon: Bike,
    title: 'Motoboy',
    description: 'Entregas rápidas de documentos e pequenos pacotes',
    color: '#f97316'
  },
  carreto: {
    icon: Truck,
    title: 'Carreto',
    description: 'Transporte de móveis e objetos médios',
    color: '#3b82f6'
  },
  mudanca: {
    icon: Home,
    title: 'Mudança',
    description: 'Mudança completa de residência',
    color: '#8b5cf6'
  },
  entulho: {
    icon: Construction,
    title: 'Entulho',
    description: 'Recolhimento de entulhos e resíduos de obras',
    color: '#64748b'
  },
  comida: {
    icon: UtensilsCrossed,
    title: 'Comida',
    description: 'Entrega de alimentos e refeições',
    color: '#ef4444'
  },
  frete: {
    icon: Package,
    title: 'Frete',
    description: 'Pequenos fretes e transportes diversos',
    color: '#10b981'
  }
};