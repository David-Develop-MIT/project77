import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, Calendar, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function HistoricoChat({ conversaId, outroParticipante }) {
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('todos'); // todos, hoje, semana, mes

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ['historico-mensagens', conversaId],
    queryFn: async () => {
      const todas = await base44.entities.Mensagem.list('created_date', 2000);
      return todas.filter(m => m.conversa_id === conversaId);
    },
    enabled: !!conversaId
  });

  // Filtrar mensagens
  const mensagensFiltradas = mensagens.filter(msg => {
    const buscaMatch = !busca || 
      (msg.tipo === 'texto' && msg.conteudo.toLowerCase().includes(busca.toLowerCase())) ||
      msg.remetente_nome.toLowerCase().includes(busca.toLowerCase());

    const hoje = new Date();
    const msgData = new Date(msg.created_date);
    let dataMatch = true;

    if (filtroData === 'hoje') {
      dataMatch = msgData.toDateString() === hoje.toDateString();
    } else if (filtroData === 'semana') {
      const semanaAtras = new Date(hoje);
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      dataMatch = msgData >= semanaAtras;
    } else if (filtroData === 'mes') {
      const mesAtras = new Date(hoje);
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      dataMatch = msgData >= mesAtras;
    }

    return buscaMatch && dataMatch;
  });

  // Agrupar por data
  const mensagensPorData = mensagensFiltradas.reduce((acc, msg) => {
    const data = format(new Date(msg.created_date), 'dd/MM/yyyy');
    if (!acc[data]) acc[data] = [];
    acc[data].push(msg);
    return acc;
  }, {});

  const exportarConversa = async () => {
    try {
      let texto = `Conversa com ${outroParticipante}\n`;
      texto += `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n`;
      texto += `Total de mensagens: ${mensagens.length}\n\n`;
      texto += '='.repeat(50) + '\n\n';

      Object.entries(mensagensPorData).forEach(([data, msgs]) => {
        texto += `\n📅 ${data}\n${'-'.repeat(50)}\n\n`;
        msgs.forEach(msg => {
          const hora = format(new Date(msg.created_date), 'HH:mm');
          texto += `[${hora}] ${msg.remetente_nome}:\n`;
          if (msg.tipo === 'texto') {
            texto += `  ${msg.conteudo}\n\n`;
          } else if (msg.tipo === 'imagem') {
            texto += `  📷 Imagem: ${msg.conteudo}\n\n`;
          } else if (msg.tipo === 'localizacao') {
            texto += `  📍 Localização: ${msg.localizacao?.endereco || msg.conteudo}\n\n`;
          }
        });
      });

      const blob = new Blob([texto], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversa-${outroParticipante}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Conversa exportada!');
    } catch (error) {
      toast.error('Erro ao exportar conversa');
    }
  };

  const stats = {
    total: mensagens.length,
    texto: mensagens.filter(m => m.tipo === 'texto').length,
    imagens: mensagens.filter(m => m.tipo === 'imagem').length,
    localizacoes: mensagens.filter(m => m.tipo === 'localizacao').length
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-slate-500">Mensagens</p>
            </div>
            <p className="text-xl font-bold text-slate-800">{stats.texto}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-slate-500">Imagens</p>
            </div>
            <p className="text-xl font-bold text-slate-800">{stats.imagens}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar mensagens..."
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'hoje', 'semana', 'mes'].map(filtro => (
            <Button
              key={filtro}
              variant={filtroData === filtro ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroData(filtro)}
              className="rounded-full text-xs"
            >
              {filtro === 'todos' ? 'Todos' : filtro === 'hoje' ? 'Hoje' : filtro === 'semana' ? '7 dias' : '30 dias'}
            </Button>
          ))}
        </div>
      </div>

      {/* Botão de exportar */}
      <Button
        onClick={exportarConversa}
        variant="outline"
        className="w-full rounded-xl"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar Conversa
      </Button>

      {/* Lista de mensagens */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {Object.entries(mensagensPorData).map(([data, msgs]) => (
            <div key={data} className="space-y-2">
              <div className="sticky top-0 bg-slate-100 rounded-lg px-3 py-1 text-xs font-medium text-slate-600 text-center">
                {data}
              </div>
              {msgs.map(msg => (
                <Card key={msg.id} className="border-slate-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-medium text-slate-700">
                        {msg.remetente_nome}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </p>
                    </div>
                    {msg.tipo === 'texto' && (
                      <p className="text-sm text-slate-600">{msg.conteudo}</p>
                    )}
                    {msg.tipo === 'imagem' && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ImageIcon className="w-4 h-4" />
                        <span>Imagem compartilhada</span>
                      </div>
                    )}
                    {msg.tipo === 'localizacao' && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Localização compartilhada</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {mensagensFiltradas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">Nenhuma mensagem encontrada</p>
        </div>
      )}
    </div>
  );
}