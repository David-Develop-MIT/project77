import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AvaliacaoModal({ pedido, onClose, tipoAvaliador, avaliadoEmail, avaliadoNome }) {
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const queryClient = useQueryClient();

  const avaliacaoMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Avaliacao.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['avaliacoes']);
      queryClient.invalidateQueries(['pedido']);
      toast.success('Avaliação enviada com sucesso!');
      onClose();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (nota === 0) {
      toast.error('Por favor, selecione uma nota');
      return;
    }

    const user = await base44.auth.me();
    
    avaliacaoMutation.mutate({
      pedido_id: pedido.id,
      avaliador_email: user.email,
      avaliado_email: avaliadoEmail,
      tipo_avaliador: tipoAvaliador,
      nota,
      comentario: comentario.trim() || undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="border-slate-100 rounded-2xl shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Avaliar {tipoAvaliador === 'cliente' ? 'Motorista' : 'Cliente'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Como foi sua experiência com {avaliadoNome}?
                </p>
                <div className="flex justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <button
                      key={estrela}
                      type="button"
                      onClick={() => setNota(estrela)}
                      onMouseEnter={() => setNotaHover(estrela)}
                      onMouseLeave={() => setNotaHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          estrela <= (notaHover || nota)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {nota > 0 && (
                  <p className="text-center text-sm text-slate-600">
                    {nota === 1 && 'Muito ruim'}
                    {nota === 2 && 'Ruim'}
                    {nota === 3 && 'Regular'}
                    {nota === 4 && 'Bom'}
                    {nota === 5 && 'Excelente'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Compartilhe sua experiência..."
                  className="rounded-xl resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {comentario.length}/500 caracteres
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={avaliacaoMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                  disabled={avaliacaoMutation.isPending || nota === 0}
                >
                  {avaliacaoMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}