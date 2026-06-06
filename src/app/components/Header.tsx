import { Search, Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onSearchChange: (value: string) => void;
  favoritesCount: number;
  onShowFavorites: () => void;
}

export function Header({ onSearchChange, favoritesCount, onShowFavorites }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm" style={{ borderColor: 'var(--border)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <button className="lg:hidden p-2 text-[#3D3835]">
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-3xl tracking-tight" style={{ color: 'var(--primary)' }}>VÖEL</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#" className="text-[#3D3835] hover:text-[#8B7355] transition-colors">Nova Coleção</a>
            <a href="#" className="text-[#3D3835] hover:text-[#8B7355] transition-colors">Vestidos</a>
            <a href="#" className="text-[#3D3835] hover:text-[#8B7355] transition-colors">Conjuntos</a>
            <a href="#" className="text-[#3D3835] hover:text-[#8B7355] transition-colors">Sobre</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#3D3835] hover:text-[#8B7355] transition-colors"
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              onClick={onShowFavorites}
              className="p-2 text-[#3D3835] hover:text-[#8B7355] transition-colors relative"
            >
              <Heart size={20} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8B7355] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="pb-4 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 rounded-lg bg-[#F5F1EC] text-[#3D3835] placeholder-[#9B8F7E] outline-none focus:ring-2 focus:ring-[#8B7355] transition-all"
              autoFocus
            />
          </div>
        )}
      </div>
    </header>
  );
}
