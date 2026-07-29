import React, { useState, useMemo, useEffect } from 'react';
import { Search, Heart, Menu, X, Instagram, Check, Zap, ArrowRight, MessageCircle, Truck, Mail } from 'lucide-react';

// --- COMPONENTE AUXILIAR DE IMAGEM ---

const ImageWithFallback = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? 'https://images.unsplash.com/photo-1594434292286-a29272892b00?q=80&w=800' : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

// --- DADOS DOS PRODUTOS ---

const allProducts = [
  {
    id: 1,
    name: 'Vestido Vermelho Elegante',
    price: 389.90,
    category: 'Vestidos',
    isFeatured: true,
    description: 'Vestido midi em tecido acetinado com caimento fluido.',
    imageUrl: 'https://images.unsplash.com/photo-1646526808599-078ce14639bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  },
  {
    id: 2,
    name: 'Vestido Laranja Verão',
    price: 349.90,
    category: 'Vestidos',
    isFeatured: false,
    description: 'Vestido longo em linho natural. Alças reguláveis.',
    imageUrl: 'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  },
  {
    id: 3,
    name: 'Conjunto Casual Bege',
    price: 299.90,
    category: 'Conjuntos',
    isFeatured: true,
    description: 'Conjunto two-piece em malha premium.',
    imageUrl: 'https://images.unsplash.com/photo-1646526822625-5376570a4832?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800'
  },
  {
    id: 4,
    name: 'Vestido Vermelho Clássico',
    price: 429.90,
    category: 'Vestidos',
    isFeatured: false,
    description: 'Vestido estruturado em crepe italiano.',
    imageUrl: 'https://images.unsplash.com/photo-1646526802762-d401936cfc16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800'
  }
];

// --- COMPONENTE HEADER ---

function Header({ onSearchChange, favoritesCount, onShowFavorites, onPageChange, activePage, activeCategory, searchQuery }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleCategoryClick = (cat) => {
    onPageChange('loja', cat);
    setIsMenuOpen(false);
  };

  const categories = ['Destaques', 'Todos', 'Vestidos', 'Conjuntos', 'Saias', 'Shorts', 'Acessórios', 'Sale'];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out border-b ${
          isScrolled 
            ? 'bg-[#FDFCF7]/70 backdrop-blur-md border-[#E5E0D8]/30 h-14' 
            : 'bg-[#FDFCF7] border-[#E5E0D8]/50 h-16'
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="flex items-center gap-2 text-[#3D3835] hover:text-[#8B7355] transition-colors group"
            >
              <Menu size={22} />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] font-medium group-hover:pl-1 transition-all">Menu</span>
            </button>
          </div>

          <button 
            onClick={() => onPageChange('loja', 'Destaques')} 
            className={`absolute left-1/2 -translate-x-1/2 font-serif tracking-[0.2em] uppercase text-[#3D3835] hover:opacity-70 transition-all ${isScrolled ? 'text-xl' : 'text-2xl'}`}
          >
            VÖEL
          </button>

          <div className="flex items-center gap-3">
            <div className={`flex items-center bg-[#F5F1EC]/80 rounded-full px-3 py-1.5 transition-all duration-500 ease-in-out ${isSearchOpen || searchQuery ? 'w-32 sm:w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <Search size={14} className="text-[#9B8F7E] min-w-[14px]" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-[11px] text-[#3D3835] ml-2 w-full placeholder:text-[#9B8F7E]/60 uppercase tracking-widest"
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-[#3D3835] hover:text-[#8B7355]">
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            <button onClick={onShowFavorites} className="relative p-2 text-[#3D3835] hover:text-[#8B7355]">
              <Heart size={20} fill={favoritesCount > 0 ? "#8B7355" : "none"} className={favoritesCount > 0 ? "text-[#8B7355]" : ""} />
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#8B7355] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-[320px] sm:w-[400px] bg-[#FDFCF7] h-full shadow-2xl animate-in slide-in-from-left duration-500 flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-[#E5E0D8]/30">
              <span className="font-serif text-[11px] tracking-[0.5em] uppercase text-[#9B8F7E]">Navegação</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-[#F5F1EC] rounded-full transition-colors">
                <X size={20} className="text-[#3D3835]" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="space-y-6">
                <p className="text-[9px] uppercase tracking-[0.4em] text-[#9B8F7E] font-bold">Coleções</p>
                <div className="flex flex-col gap-6">
                  {categories.map(cat => {
                    const isItemSelected = (cat === activeCategory && activePage === 'loja');
                    return (
                      <button 
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`block text-sm uppercase tracking-[0.3em] w-full text-left transition-all hover:translate-x-2 ${isItemSelected ? 'text-[#8B7355] font-bold' : 'text-[#3D3835] hover:text-[#8B7355]'}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-10 border-t border-[#E5E0D8]/30 space-y-6">
                <p className="text-[9px] uppercase tracking-[0.4em] text-[#9B8F7E] font-bold">Institucional</p>
                <div className="flex flex-col gap-6">
                  <button 
                    onClick={() => { onPageChange('sobre'); setIsMenuOpen(false); }}
                    className={`block text-sm uppercase tracking-[0.3em] w-full text-left transition-all hover:translate-x-2 ${activePage === 'sobre' ? 'text-[#8B7355] font-bold' : 'text-[#3D3835] hover:text-[#8B7355]'}`}
                  >
                    Nossa História
                  </button>
                  <button onClick={() => { onShowFavorites(); setIsMenuOpen(false); }} className="block text-sm uppercase tracking-[0.3em] w-full text-left text-[#3D3835] hover:text-[#8B7355] transition-all hover:translate-x-2">
                    Favoritos
                  </button>
                  <button 
                    onClick={() => { window.open('https://wa.me/5511930224490'); setIsMenuOpen(false); }}
                    className="block text-sm uppercase tracking-[0.3em] w-full text-left text-[#3D3835] hover:text-[#8B7355] transition-all hover:translate-x-2"
                  >
                    Contato
                  </button>
                </div>
              </div>
            </nav>

            <div className="p-10 bg-[#F5F1EC]/50 border-t border-[#E5E0D8]/30">
                <div className="flex items-center justify-between">
                  <a href="https://www.instagram.com/voel.oficial" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#3D3835] hover:text-[#8B7355] transition-colors">
                    <Instagram size={18} />
                    <span className="text-[10px] uppercase tracking-[0.2em]">@voel.oficial</span>
                  </a>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Destaques');
  const [activePage, setActivePage] = useState('loja');

  // Lógica Global de Busca
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setActivePage('loja');
      setShowFavorites(false);
      setActiveCategory('Todos'); // Garante que a busca procure em tudo
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handlePageChange = (page, category = 'Destaques') => {
    setActivePage(page);
    setActiveCategory(category);
    setShowFavorites(false);
    setSearchQuery(''); // Limpa a busca ao navegar manualmente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (productName) => {
    const text = `Olá! Gostaria de saber mais sobre o produto: ${productName}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/5511930224490?text=${encodedText}`, '_blank');
  };

  const handleWhatsAppChat = () => {
    const text = `Olá! Preciso de atendimento.`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/5511930224490?text=${encodedText}`, '_blank');
  };

  const filteredProducts = useMemo(() => {
    let items = allProducts;
    
    // Filtro de busca global
    if (searchQuery) {
      return items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (showFavorites) {
      items = items.filter(p => favorites.includes(p.id));
    } else if (activeCategory === 'Destaques') {
      items = items.filter(p => p.isFeatured === true);
    } else if (activeCategory !== 'Todos') {
      items = items.filter(p => p.category === activeCategory);
    }
    
    return items;
  }, [searchQuery, showFavorites, favorites, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#3D3835] selection:bg-[#8B7355]/20 font-sans">
      <Header
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        favoritesCount={favorites.length}
        onShowFavorites={() => { setShowFavorites(!showFavorites); setActivePage('loja'); setSearchQuery(''); }}
        onPageChange={handlePageChange}
        activePage={activePage}
        activeCategory={activeCategory}
      />

      <main>
        {activePage === 'loja' ? (
          <>
            {!showFavorites && activeCategory === 'Destaques' && !searchQuery && (
              <section className="relative h-[90vh] w-full overflow-hidden bg-[#F5F1EC]">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000" 
                  alt="Nova Coleção" 
                  className="w-full h-full object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center text-white">
                  <h1 className="font-serif text-5xl md:text-7xl uppercase tracking-[0.2em] mb-4 drop-shadow-lg text-center px-4">VÖEL Brand</h1>
                  <p className="text-sm md:text-lg uppercase tracking-[0.4em] mb-10 font-light drop-shadow-md">A essência do minimalismo</p>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('vitrine');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white text-[#3D3835] px-10 py-4 text-xs uppercase tracking-[0.3em] hover:bg-[#3D3835] hover:text-white transition-all duration-500 rounded-full flex items-center gap-3 group"
                  >
                    Ver Vitrine <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>
            )}

            <div className={(!showFavorites && activeCategory === 'Destaques' && !searchQuery) ? "" : "pt-24"}>
              <section id="vitrine" className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-serif uppercase tracking-[0.3em] mb-3">
                    {searchQuery ? `Resultados para "${searchQuery}"` : (showFavorites ? 'Meus Favoritos' : (activeCategory === 'Todos' ? 'Coleção Completa' : activeCategory))}
                  </h2>
                  <p className="text-[#9B8F7E] text-[10px] uppercase tracking-[0.5em] font-light">
                    {searchQuery ? `${filteredProducts.length} itens encontrados` : 'Peças exclusivas selecionadas para você'}
                  </p>
                  <div className="w-12 h-px bg-[#8B7355] mx-auto mt-8 opacity-40"></div>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="group cursor-pointer">
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F1EC] mb-6 rounded-2xl shadow-sm border border-[#E5E0D8]/30">
                          <ImageWithFallback src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                            className="absolute top-4 right-4 p-2.5 bg-white/80 hover:bg-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10"
                          >
                            <Heart size={16} fill={favorites.includes(p.id) ? "#8B7355" : "none"} className={favorites.includes(p.id) ? "text-[#8B7355]" : "text-[#3D3835]"} />
                          </button>
                          
                          <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleBuyNow(p.name); }}
                              className="w-full bg-[#8B7355] text-white py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#6D5A42] transition-colors"
                            >
                              <MessageCircle size={14} /> Comprar agora
                            </button>
                          </div>

                          {p.isFeatured && (
                            <div className="absolute top-4 left-4 bg-[#8B7355] text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">Exclusivo</div>
                          )}
                        </div>
                        
                        <div className="space-y-2 px-1">
                          <p className="text-[#9B8F7E] text-[9px] uppercase tracking-[0.2em] font-medium">{p.category}</p>
                          <h3 className="text-[#3D3835] text-sm tracking-[0.1em] font-light group-hover:text-[#8B7355] transition-colors">{p.name}</h3>
                          <p className="text-[#3D3835] text-xs font-semibold tracking-widest pt-1">R$ {p.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <p className="text-[#9B8F7E] uppercase tracking-widest text-sm">Nenhum item encontrado.</p>
                    <button onClick={() => { setSearchQuery(''); setActiveCategory('Todos'); }} className="text-[#8B7355] text-xs uppercase tracking-widest underline underline-offset-4">Ver toda a coleção</button>
                  </div>
                )}

                {!showFavorites && activeCategory === 'Destaques' && !searchQuery && (
                  <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-16 py-20 border-t border-[#E5E0D8]/40 bg-[#F5F1EC]/30 rounded-3xl">
                    <div className="flex flex-col items-center text-center px-6 group">
                      <div className="w-16 h-16 border border-[#8B7355]/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B7355]/10 transition-colors">
                        <Check className="text-[#8B7355]" size={24} />
                      </div>
                      <h4 className="font-serif text-sm uppercase tracking-[0.3em] mb-4">Qualidade Premium</h4>
                      <p className="text-[#9B8F7E] text-[11px] leading-relaxed tracking-widest">Materiais selecionados e acabamento impecável em cada detalhe das nossas peças.</p>
                    </div>
                    <div className="flex flex-col items-center text-center px-6 group">
                      <div className="w-16 h-16 border border-[#8B7355]/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B7355]/10 transition-colors">
                        <Zap className="text-[#8B7355]" size={24} />
                      </div>
                      <h4 className="font-serif text-sm uppercase tracking-[0.3em] mb-4">Entregas</h4>
                      <p className="text-[#9B8F7E] max-w-[21rem] text-pretty text-xs md:text-[11px] leading-relaxed tracking-wide">Todas as entregas somente aos sábados temporariamente.</p>
                    </div>
                    <div className="flex flex-col items-center text-center px-6 group">
                      <div className="w-16 h-16 border border-[#8B7355]/30 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B7355]/10 transition-colors">
                        <Heart className="text-[#8B7355]" size={24} />
                      </div>
                      <h4 className="font-serif text-sm uppercase tracking-[0.3em] mb-4">Troca Garantida</h4>
                      <p className="text-[#9B8F7E] max-w-[21rem] text-pretty text-xs md:text-[11px] leading-relaxed tracking-wide">Até 7 dias para solicitar troca ou devolução. O reembolso é realizado após o recebimento e conferência da peça em nossa loja.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <section className="container mx-auto px-4 py-32 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
                 <ImageWithFallback src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800" alt="Sobre VÖEL" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-[#8B7355]/5"></div>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-[#8B7355] text-[10px] uppercase tracking-[0.5em] font-bold">Nossa História</span>
                  <h2 className="text-4xl font-serif uppercase tracking-[0.2em]">O conceito VÖEL</h2>
                </div>
                <div className="space-y-6 text-[#7A7067] font-light leading-relaxed text-sm sm:text-base tracking-wide">
                  <p>A VÖEL nasceu do desejo de criar uma moda que celebra a essência feminina através de peças atemporais, fluidas e sofisticadas.</p>
                  <p>Cada detalhe, da escolha das fibras naturais ao acabamento manual, é pensado para a mulher que valoriza o conforto sem abrir mão da elegância minimalista.</p>
                  <p>O nosso compromisso é com a moda consciente: poucas peças, altíssima qualidade e um design que transcende as estações passageiras.</p>
                  <p className="italic font-serif text-[#8B7355] text-lg pt-6 border-t border-[#E5E0D8]/40">"Moda que transcende tendências e celebra a sua essência."</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#332F2C] text-[#FDFCF7] pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl tracking-[0.4em] uppercase">VÖEL</h2>
              <p className="text-[#9B8F7E] text-[11px] tracking-[0.2em] leading-relaxed max-w-[280px]">Moda feminina contemporânea para mulheres que valorizam elegância, qualidade e a beleza do essencial.</p>
            </div>
            
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.4em] mb-10 font-bold text-white/90">AJUDA</h4>
              <ul className="space-y-5 text-[#9B8F7E] text-[11px] uppercase tracking-[0.3em]">
                <li>
                  <button onClick={handleWhatsAppChat} className="hover:text-white transition-colors flex items-center gap-2 group">
                    <MessageCircle size={14} className="group-hover:text-[#8B7355] transition-colors" /> Atendimento
                  </button>
                </li>
                <li>
                  <a href="https://rastreamento.correios.com.br/app/index.php" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <Truck size={14} className="group-hover:text-[#8B7355] transition-colors" /> Rastreamento
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@voel.com.br" className="hover:text-white transition-colors flex items-center gap-2 group lowercase tracking-widest pt-2 border-t border-white/5">
                    <Mail size={14} className="group-hover:text-[#8B7355] transition-colors" /> contato@voel.com.br
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col">
              <h4 className="text-[11px] uppercase tracking-[0.4em] mb-10 font-bold text-white/90">SIGA-NOS</h4>
              <a 
                href="https://www.instagram.com/voel.oficial" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative block w-full max-w-[280px] bg-[#FDFCF7] p-5 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5F1EC] rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="relative flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#332F2C] rounded-xl transition-colors group-hover:bg-[#8B7355]">
                    <Instagram size={24} className="text-[#FDFCF7]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#332F2C]">@voel.oficial</p>
                    <p className="text-[8px] uppercase tracking-widest text-[#9B8F7E] mt-0.5">Acompanhe nossas novidades</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       <div className="w-6 h-6 rounded-full border-2 border-[#FDFCF7] bg-[#E5E0D8]"></div>
                       <div className="w-6 h-6 rounded-full border-2 border-[#FDFCF7] bg-[#D4CDBE]"></div>
                       <div className="w-6 h-6 rounded-full border-2 border-[#FDFCF7] bg-[#F5F1EC]"></div>
                    </div>
                    <div className="text-[#332F2C] opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight size={16} />
                    </div>
                </div>
              </a>
            </div>
          </div>
          <div className="text-center pt-12 border-t border-white/5">
            <p className="text-[9px] text-[#9B8F7E]/40 tracking-[0.5em] uppercase font-light">© 2026 VÖEL. TODOS OS DIREITOS RESERVADOS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
