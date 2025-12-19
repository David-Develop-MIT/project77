import DetalheMotorista from './pages/DetalheMotorista';
import DetalhePedido from './pages/DetalhePedido';
import EscolherPerfil from './pages/EscolherPerfil';
import Home from './pages/Home';
import MeusPedidos from './pages/MeusPedidos';
import MeusPedidosMotorista from './pages/MeusPedidosMotorista';
import Motoristas from './pages/Motoristas';
import NovoMotorista from './pages/NovoMotorista';
import NovoPedido from './pages/NovoPedido';
import PedidosDisponiveis from './pages/PedidosDisponiveis';
import TabelaPrecos from './pages/TabelaPrecos';
import TornarseMotorista from './pages/TornarseMotorista';
import MeusVeiculos from './pages/MeusVeiculos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DetalheMotorista": DetalheMotorista,
    "DetalhePedido": DetalhePedido,
    "EscolherPerfil": EscolherPerfil,
    "Home": Home,
    "MeusPedidos": MeusPedidos,
    "MeusPedidosMotorista": MeusPedidosMotorista,
    "Motoristas": Motoristas,
    "NovoMotorista": NovoMotorista,
    "NovoPedido": NovoPedido,
    "PedidosDisponiveis": PedidosDisponiveis,
    "TabelaPrecos": TabelaPrecos,
    "TornarseMotorista": TornarseMotorista,
    "MeusVeiculos": MeusVeiculos,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};