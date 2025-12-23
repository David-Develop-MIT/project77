import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EnderecoAutocomplete({ 
  label, 
  value, 
  onChange, 
  onSelectAddress,
  placeholder = "Digite um endereço para buscar...",
  color = "text-emerald-500",
  required = false 
}) {
  const [query, setQuery] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar sugestões na API do Nominatim (OpenStreetMap)
  const buscarEndereco = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSugestoes([]);
      return;
    }

    setLoading(true);
    try {
      // Adicionar "Brasil" à busca para priorizar resultados brasileiros
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery + ', Brasil')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=br`
      );
      
      const data = await response.json();
      
      // Formatar os resultados
      const sugestoesFormatadas = data.map(item => ({
        display_name: item.display_name,
        address: item.address,
        lat: item.lat,
        lon: item.lon,
        // Extrair informações relevantes
        logradouro: item.address.road || item.address.pedestrian || '',
        numero: item.address.house_number || '',
        bairro: item.address.suburb || item.address.neighbourhood || '',
        cidade: item.address.city || item.address.town || item.address.municipality || '',
        estado: item.address.state || '',
        cep: item.address.postcode || ''
      }));
      
      setSugestoes(sugestoesFormatadas);
      setShowSugestoes(true);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      setSugestoes([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce na busca
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (newQuery.length >= 3) {
      timeoutRef.current = setTimeout(() => {
        buscarEndereco(newQuery);
      }, 500);
    } else {
      setSugestoes([]);
      setShowSugestoes(false);
    }
  };

  const handleSelectSugestao = (sugestao) => {
    setQuery(sugestao.display_name);
    setShowSugestoes(false);
    
    // Chamar callback com os dados do endereço
    if (onSelectAddress) {
      onSelectAddress({
        endereco: sugestao.logradouro,
        numero: sugestao.numero,
        bairro: sugestao.bairro,
        cidade: sugestao.cidade,
        estado: sugestao.estado,
        cep: sugestao.cep,
        latitude: parseFloat(sugestao.lat),
        longitude: parseFloat(sugestao.lon)
      });
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <Label className={`text-slate-700 flex items-center gap-2`}>
        <MapPin className={`w-4 h-4 ${color}`} />
        {label} {required && '*'}
      </Label>
      
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => sugestoes.length > 0 && setShowSugestoes(true)}
          className="rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 pr-10"
        />
        
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
        
        {!loading && query.length >= 3 && (
          <Navigation className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      <AnimatePresence>
        {showSugestoes && sugestoes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {sugestoes.map((sugestao, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSugestao(sugestao)}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-4 h-4 ${color} mt-1 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {sugestao.logradouro}{sugestao.numero ? `, ${sugestao.numero}` : ''}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {[sugestao.bairro, sugestao.cidade, sugestao.estado]
                          .filter(Boolean)
                          .join(' - ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {query.length > 0 && query.length < 3 && (
        <p className="text-xs text-slate-500">Digite pelo menos 3 caracteres para buscar</p>
      )}
    </div>
  );
}