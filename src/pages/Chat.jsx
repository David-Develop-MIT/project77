import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ListaConversas from '@/components/chat/ListaConversas';
import JanelaChat from '@/components/chat/JanelaChat';

export default function Chat() {
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [mostrarLista, setMostrarLista] = useState(true);

  const handleSelectConversa = (id) => {
    setConversaSelecionada(id);
    setMostrarLista(false);
  };

  const handleVoltar = () => {
    setConversaSelecionada(null);
    setMostrarLista(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-screen flex flex-col">
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center gap-4 p-4 bg-white border-b border-slate-200">
          {!mostrarLista && (
            <Button variant="ghost" size="icon" onClick={handleVoltar} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Chat</h1>
              <p className="text-xs text-slate-500">Mensagens em tempo real</p>
            </div>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden lg:flex items-center justify-between p-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Chat</h1>
                <p className="text-sm text-slate-500">Mensagens em tempo real</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Conversas - Desktop sempre visível */}
          <div className="hidden lg:block w-80 border-r border-slate-200 bg-white">
            <ListaConversas 
              onSelectConversa={handleSelectConversa}
              conversaSelecionada={conversaSelecionada}
            />
          </div>

          {/* Lista de Conversas - Mobile condicional */}
          {mostrarLista && (
            <div className="lg:hidden flex-1 bg-white">
              <ListaConversas 
                onSelectConversa={handleSelectConversa}
                conversaSelecionada={conversaSelecionada}
              />
            </div>
          )}

          {/* Janela de Chat - Desktop */}
          <div className="hidden lg:block flex-1 bg-slate-50">
            <JanelaChat conversaId={conversaSelecionada} />
          </div>

          {/* Janela de Chat - Mobile condicional */}
          {!mostrarLista && conversaSelecionada && (
            <div className="lg:hidden flex-1 bg-slate-50">
              <JanelaChat conversaId={conversaSelecionada} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}