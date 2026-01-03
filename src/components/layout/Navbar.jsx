import { Link } from 'react-router-dom';
import { ShoppingBag, User, Heart, Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-voel-beige/80 backdrop-blur-md border-b border-voel-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Lado Esquerdo: Links ou Busca */}
          <div className="flex items-center space-x-4">
            <button className="text-voel-charcoal hover:text-voel-gold transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Centro: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/home" className="text-2xl font-serif tracking-[0.4em] text-voel-charcoal hover:opacity-70 transition-opacity">
              VÖEL
            </Link>
          </div>

          {/* Lado Direito: Ícones */}
          <div className="flex items-center space-x-5">
            <Link to="/favoritos" className="text-voel-charcoal hover:text-voel-gold transition-colors">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
            <Link to="/perfil" className="text-voel-charcoal hover:text-voel-gold transition-colors">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <button className="relative text-voel-charcoal hover:text-voel-gold transition-colors">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {/* Contador de itens no carrinho (opcional) */}
              <span className="absolute -top-1 -right-1 bg-voel-gold text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                0
              </span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
