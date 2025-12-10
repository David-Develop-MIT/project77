import Home from './pages/Home';
import NovoPedido from './pages/NovoPedido';
import MeusPedidos from './pages/MeusPedidos';
import DetalhePedido from './pages/DetalhePedido';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "NovoPedido": NovoPedido,
    "MeusPedidos": MeusPedidos,
    "DetalhePedido": DetalhePedido,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};