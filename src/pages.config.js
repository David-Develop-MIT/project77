import DetalhePedido from './pages/DetalhePedido';
import Home from './pages/Home';
import MeusPedidos from './pages/MeusPedidos';
import NovoPedido from './pages/NovoPedido';
import TabelaPrecos from './pages/TabelaPrecos';
import Motoristas from './pages/Motoristas';
import NovoMotorista from './pages/NovoMotorista';
import DetalheMotorista from './pages/DetalheMotorista';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DetalhePedido": DetalhePedido,
    "Home": Home,
    "MeusPedidos": MeusPedidos,
    "NovoPedido": NovoPedido,
    "TabelaPrecos": TabelaPrecos,
    "Motoristas": Motoristas,
    "NovoMotorista": NovoMotorista,
    "DetalheMotorista": DetalheMotorista,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};