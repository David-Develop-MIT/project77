import Home from './pages/Home';
import NovoPedido from './pages/NovoPedido';
import MeusPedidos from './pages/MeusPedidos';
import DetalhePedido from './pages/DetalhePedido';
import TabelaPrecos from './pages/TabelaPrecos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "NovoPedido": NovoPedido,
    "MeusPedidos": MeusPedidos,
    "DetalhePedido": DetalhePedido,
    "TabelaPrecos": TabelaPrecos,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};