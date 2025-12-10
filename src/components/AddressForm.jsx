import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AddressForm({ 
  label, 
  cep, 
  endereco, 
  numero, 
  complemento,
  onCepChange,
  onEnderecoChange,
  onNumeroChange,
  onComplementoChange,
  required = true,
  color = "text-emerald-500"
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscarCep = async (cepValue) => {
    const cepLimpo = cepValue.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        toast.error('CEP não encontrado');
        return;
      }

      // Preenche os campos automaticamente
      const enderecoCompleto = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      onEnderecoChange(enderecoCompleto);
      toast.success('Endereço encontrado!');
    } catch (err) {
      setError('Erro ao buscar CEP');
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (e) => {
    const value = e.target.value;
    onCepChange(value);
    
    // Formata o CEP enquanto digita
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCep(value);
    }
  };

  const formatCep = (value) => {
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-slate-700 flex items-center gap-2">
        <MapPin className={`w-4 h-4 ${color}`} />
        {label} {required && '*'}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600 text-sm">CEP {required && '*'}</Label>
          <div className="relative">
            <Input
              placeholder="00000-000"
              value={formatCep(cep)}
              onChange={handleCepChange}
              maxLength={9}
              className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
        
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-slate-600 text-sm">Endereço {required && '*'}</Label>
          <Input
            placeholder="Rua, bairro, cidade - UF"
            value={endereco}
            onChange={(e) => onEnderecoChange(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-600 text-sm">Número {required && '*'}</Label>
          <Input
            placeholder="Nº"
            value={numero}
            onChange={(e) => onNumeroChange(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
        
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-slate-600 text-sm">Complemento</Label>
          <Input
            placeholder="Apto, bloco, etc."
            value={complemento}
            onChange={(e) => onComplementoChange(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
}