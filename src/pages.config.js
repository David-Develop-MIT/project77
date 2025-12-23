import AdminBoost from './pages/AdminBoost';
import AdminFaturas from './pages/AdminFaturas';
import Carteira from './pages/Carteira';
import Chat from './pages/Chat';
import CompletarPerfil from './pages/CompletarPerfil';
import DetalheMotorista from './pages/DetalheMotorista';
import DetalhePedido from './pages/DetalhePedido';
import EscolherPerfil from './pages/EscolherPerfil';
import FazerOferta from './pages/FazerOferta';
import HistoricoEntregas from './pages/HistoricoEntregas';
import Home from './pages/Home';
import MeusPedidos from './pages/MeusPedidos';
import MeusPedidosMotorista from './pages/MeusPedidosMotorista';
import MeusVeiculos from './pages/MeusVeiculos';
import Motoristas from './pages/Motoristas';
import NovoMotorista from './pages/NovoMotorista';
import NovoPedido from './pages/NovoPedido';
import PagamentoCancelado from './pages/PagamentoCancelado';
import PagamentoPix from './pages/PagamentoPix';
import PagamentoSucesso from './pages/PagamentoSucesso';
import PedidosDisponiveis from './pages/PedidosDisponiveis';
import PerfilCliente from './pages/PerfilCliente';
import PerfilMotorista from './pages/PerfilMotorista';
import TabelaPrecos from './pages/TabelaPrecos';
import TornarseMotorista from './pages/TornarseMotorista';
import TokenLogin from './pages/TokenLogin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBoost": AdminBoost,
    "AdminFaturas": AdminFaturas,
    "Carteira": Carteira,
    "Chat": Chat,
    "CompletarPerfil": CompletarPerfil,
    "DetalheMotorista": DetalheMotorista,
    "DetalhePedido": DetalhePedido,
    "EscolherPerfil": EscolherPerfil,
    "FazerOferta": FazerOferta,
    "HistoricoEntregas": HistoricoEntregas,
    "Home": Home,
    "MeusPedidos": MeusPedidos,
    "MeusPedidosMotorista": MeusPedidosMotorista,
    "MeusVeiculos": MeusVeiculos,
    "Motoristas": Motoristas,
    "NovoMotorista": NovoMotorista,
    "NovoPedido": NovoPedido,
    "PagamentoCancelado": PagamentoCancelado,
    "PagamentoPix": PagamentoPix,
    "PagamentoSucesso": PagamentoSucesso,
    "PedidosDisponiveis": PedidosDisponiveis,
    "PerfilCliente": PerfilCliente,
    "PerfilMotorista": PerfilMotorista,
    "TabelaPrecos": TabelaPrecos,
    "TornarseMotorista": TornarseMotorista,
    "TokenLogin": TokenLogin,
}

export const pagesConfig = {
    mainPage: "TokenLogin",
    Pages: PAGES,
    Layout: __Layout,
};