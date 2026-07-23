import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ChangeEvent, MouseEvent } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Heart, Instagram, Mail, Menu, MessageCircle, Search, Truck, X, Zap } from 'lucide-react';
import { fetchPublicCatalog } from '../services/catalogService';
import type { Category, Product } from '../types/catalog';

const favoriteStorageKey = 'voel:favorites';
const whatsappNumber = '5511930224490';
const publicLowStockLimit = 3;
const productZoomScale = 1.85;

type MenuItem = {
  label: string;
  value: string;
};

type PaymentMode = 'cash' | 'installments';

type PurchaseOptions = {
  size?: string;
  color?: string;
  quantity?: number;
  cep?: string;
  paymentMode?: PaymentMode;
  installments?: number;
};

function ImageWithFallback({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: CSSProperties }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <img
      src={error || !src ? 'https://images.unsplash.com/photo-1594434292286-a29272892b00?q=80&w=800' : src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function getInstallmentText(product: Product) {
  if (product.maxInstallments <= 1) return '';
  return `ou ${product.maxInstallments}x de ${formatCurrency(product.price / product.maxInstallments)}`;
}

function getImageUrls(imageValue: Product['colorImages'][string] | undefined) {
  if (typeof imageValue === 'string') {
    const imageUrl = imageValue.trim();
    return imageUrl ? [imageUrl] : [];
  }

  if (!Array.isArray(imageValue)) return [];

  return imageValue.reduce<string[]>((imageUrls, item) => {
    const imageUrl = item.trim();
    if (!imageUrl || imageUrls.includes(imageUrl)) return imageUrls;
    return [...imageUrls, imageUrl];
  }, []);
}

function getColorImages(product: Product, selectedColor: string) {
  if (!selectedColor) return [];

  const directImages = getImageUrls(product.colorImages[selectedColor]);
  if (directImages.length > 0) return directImages;

  const normalizedSelectedColor = normalizeText(selectedColor);
  const matchedImageValue = Object.entries(product.colorImages).find(([color]) => normalizeText(color) === normalizedSelectedColor)?.[1];
  return getImageUrls(matchedImageValue);
}

function getFirstAvailableColorImages(product: Product) {
  for (const imageValue of Object.values(product.colorImages)) {
    const imageUrls = getImageUrls(imageValue);
    if (imageUrls.length > 0) return imageUrls;
  }

  return [];
}

function getProductGalleryImages(product: Product, selectedColor: string) {
  if (selectedColor) {
    const colorImages = getColorImages(product, selectedColor);
    if (colorImages.length > 0) return colorImages;
    return product.imageUrl ? [product.imageUrl] : [];
  }

  if (product.imageUrl) return [product.imageUrl];
  return getFirstAvailableColorImages(product);
}

function getProductLink(product: Product) {
  return `${window.location.origin}${window.location.pathname}#produto-${product.id}`;
}

function isOutOfStock(product: Product) {
  return product.stockQuantity <= 0;
}

function getStockNotice(product: Product) {
  if (isOutOfStock(product)) return 'Esgotado';
  if (product.stockQuantity <= publicLowStockLimit) return `Só ${product.stockQuantity} disponíveis!`;
  return '';
}

interface HeaderProps {
  onSearchChange: (q: string) => void;
  searchQuery: string;
  favoritesCount: number;
  onShowFavorites: () => void;
  onPageChange: (page: string, category?: string) => void;
  activePage: string;
  activeCategory: string;
  menuItems: MenuItem[];
}

function Header({
  onSearchChange,
  searchQuery,
  favoritesCount,
  onShowFavorites,
  onPageChange,
  activePage,
  activeCategory,
  menuItems,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (category: string) => {
    onPageChange('loja', category);
    setIsMenuOpen(false);
  };

  const showSearch = isSearchOpen || searchQuery.length > 0;

  const clearSearch = () => {
    onSearchChange('');
    setIsSearchOpen(false);
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 border-b transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'border-[#E5E0D8]/30 bg-[#FDFCF7]/80 shadow-sm backdrop-blur-md'
            : 'border-[#E5E0D8]/50 bg-[#FDFCF7]'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className={`${isScrolled ? 'min-h-14' : 'min-h-16'} grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2 transition-all duration-500`}>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="group flex h-10 shrink-0 items-center gap-2 rounded-full px-1 text-[#3D3835] transition-colors hover:text-[#8B7355] sm:px-2"
              type="button"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] transition-all group-hover:pl-1 sm:inline">Menu</span>
            </button>

            <button
              onClick={() => onPageChange('loja', 'Destaques')}
              className={`min-w-0 justify-self-center truncate px-2 font-serif uppercase tracking-[0.2em] text-[#3D3835] transition-all hover:opacity-70 ${isScrolled ? 'text-xl' : 'text-2xl'}`}
              type="button"
            >
              VÖEL
            </button>

            <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2">
              <div className={`hidden items-center rounded-full bg-[#F5F1EC]/80 py-1.5 transition-all duration-500 ease-in-out md:flex ${showSearch ? 'w-64 px-3 opacity-100' : 'w-0 overflow-hidden px-0 opacity-0'}`}>
                <Search size={14} className="min-w-[14px] text-[#9B8F7E]" />
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Buscar..."
                  className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[11px] uppercase tracking-widest text-[#3D3835] outline-none placeholder:text-[#9B8F7E]/60"
                  onChange={(event) => onSearchChange(event.target.value)}
                  autoFocus={isSearchOpen}
                />
                {showSearch && (
                  <button
                    onClick={clearSearch}
                    className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#9B8F7E] transition-colors hover:bg-[#E5E0D8]/60 hover:text-[#3D3835]"
                    type="button"
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#3D3835] transition-colors hover:bg-[#F5F1EC] hover:text-[#8B7355]"
                type="button"
                aria-label="Abrir busca"
              >
                <Search size={20} />
              </button>

              <button
                onClick={onShowFavorites}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#3D3835] transition-colors hover:bg-[#F5F1EC] hover:text-[#8B7355]"
                type="button"
                aria-label="Ver favoritos"
              >
                <Heart size={20} fill={favoritesCount > 0 ? '#8B7355' : 'none'} className={favoritesCount > 0 ? 'text-[#8B7355]' : ''} />
                {favoritesCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B7355] px-1 text-[9px] font-bold text-white">
                    {favoritesCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className={`${showSearch ? 'flex md:hidden' : 'hidden'} items-center gap-2 pb-3`}>
            <label className="flex min-w-0 flex-1 items-center rounded-full bg-[#F5F1EC]/90 px-3 py-2.5">
              <Search size={15} className="shrink-0 text-[#9B8F7E]" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Buscar produtos..."
                className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[12px] uppercase tracking-widest text-[#3D3835] outline-none placeholder:text-[#9B8F7E]/60"
                onChange={(event) => onSearchChange(event.target.value)}
                autoFocus={isSearchOpen}
              />
            </label>

            <button
              onClick={clearSearch}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F1EC] text-[#3D3835] transition-colors hover:bg-[#E5E0D8]"
              type="button"
              aria-label="Limpar busca"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative flex h-full w-[86vw] max-w-[400px] flex-col bg-[#FDFCF7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8]/30 p-6 sm:p-8">
              <span className="font-serif text-[11px] uppercase tracking-[0.5em] text-[#9B8F7E]">Navegação</span>
              <button onClick={() => setIsMenuOpen(false)} className="rounded-full p-2 transition-colors hover:bg-[#F5F1EC]" type="button">
                <X size={20} className="text-[#3D3835]" />
              </button>
            </div>

            <nav className="flex-1 space-y-10 overflow-y-auto p-8 sm:p-10">
              <div className="space-y-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#9B8F7E]">Coleções</p>
                <div className="flex flex-col gap-6">
                  {menuItems.map(item => {
                    const isSelected = item.value === activeCategory && activePage === 'loja';
                    return (
                      <button
                        key={item.value}
                        onClick={() => handleCategoryClick(item.value)}
                        className={`block w-full text-left text-sm uppercase tracking-[0.3em] transition-all hover:translate-x-2 ${isSelected ? 'font-bold text-[#8B7355]' : 'text-[#3D3835] hover:text-[#8B7355]'}`}
                        type="button"
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6 border-t border-[#E5E0D8]/30 pt-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#9B8F7E]">Institucional</p>
                <div className="flex flex-col gap-6">
                  <button
                    onClick={() => { onPageChange('sobre'); setIsMenuOpen(false); }}
                    className={`block w-full text-left text-sm uppercase tracking-[0.3em] transition-all hover:translate-x-2 ${activePage === 'sobre' ? 'font-bold text-[#8B7355]' : 'text-[#3D3835] hover:text-[#8B7355]'}`}
                    type="button"
                  >
                    Nossa História
                  </button>
                  <button
                    onClick={() => { onShowFavorites(); setIsMenuOpen(false); }}
                    className="block w-full text-left text-sm uppercase tracking-[0.3em] text-[#3D3835] transition-all hover:translate-x-2 hover:text-[#8B7355]"
                    type="button"
                  >
                    Favoritos
                  </button>
                  <button
                    onClick={() => { window.open(`https://wa.me/${whatsappNumber}`); setIsMenuOpen(false); }}
                    className="block w-full text-left text-sm uppercase tracking-[0.3em] text-[#3D3835] transition-all hover:translate-x-2 hover:text-[#8B7355]"
                    type="button"
                  >
                    Contato
                  </button>
                </div>
              </div>
            </nav>

            <div className="border-t border-[#E5E0D8]/30 bg-[#F5F1EC]/50 p-10">
              <a
                href="https://www.instagram.com/voel.oficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[#3D3835] transition-colors hover:text-[#8B7355]"
              >
                <Instagram size={18} />
                <span className="text-[10px] uppercase tracking-[0.2em]">@voel.oficial</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CatalogFooter({ onWhatsAppChat }: { onWhatsAppChat: () => void }) {
  return (
    <footer className="bg-[#332F2C] pb-12 pt-24 text-[#FDFCF7]">
      <div className="container mx-auto px-4">
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-3">
          <div className="space-y-6">
            <h2 className="font-serif text-3xl uppercase tracking-[0.4em]">VÖEL</h2>
            <p className="max-w-[280px] text-[11px] leading-relaxed tracking-[0.2em] text-[#9B8F7E]">
              Moda feminina contemporânea para mulheres que valorizam elegância, qualidade e a beleza do essencial.
            </p>
          </div>

          <div>
            <h4 className="mb-10 text-[11px] font-bold uppercase tracking-[0.4em] text-white/90">AJUDA</h4>
            <ul className="space-y-5 text-[11px] uppercase tracking-[0.3em] text-[#9B8F7E]">
              <li>
                <button onClick={onWhatsAppChat} className="group flex items-center gap-2 transition-colors hover:text-white" type="button">
                  <MessageCircle size={14} className="transition-colors group-hover:text-[#8B7355]" /> Atendimento
                </button>
              </li>
              <li>
                <a href="https://rastreamento.correios.com.br/app/index.php" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 transition-colors hover:text-white">
                  <Truck size={14} className="transition-colors group-hover:text-[#8B7355]" /> Rastreamento
                </a>
              </li>
              <li>
                <a href="mailto:contato@voel.com.br" className="group flex items-center gap-2 border-t border-white/5 pt-2 lowercase tracking-widest transition-colors hover:text-white">
                  <Mail size={14} className="transition-colors group-hover:text-[#8B7355]" /> contato@voel.com.br
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="mb-10 text-[11px] font-bold uppercase tracking-[0.4em] text-white/90">SIGA-NOS</h4>
            <a
              href="https://www.instagram.com/voel.oficial"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full max-w-[280px] overflow-hidden rounded-lg bg-[#FDFCF7] p-5 shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-[#F5F1EC] transition-transform duration-700 group-hover:scale-150" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#332F2C] transition-colors group-hover:bg-[#8B7355]">
                  <Instagram size={24} className="text-[#FDFCF7]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#332F2C]">@voel.oficial</p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-widest text-[#9B8F7E]">Acompanhe nossas novidades</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-[#FDFCF7] bg-[#E5E0D8]" />
                  <div className="h-6 w-6 rounded-full border-2 border-[#FDFCF7] bg-[#D4CDBE]" />
                  <div className="h-6 w-6 rounded-full border-2 border-[#FDFCF7] bg-[#F5F1EC]" />
                </div>
                <div className="text-[#332F2C] opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight size={16} />
                </div>
              </div>
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-12 text-center">
          <p className="text-[9px] font-light uppercase tracking-[0.5em] text-[#9B8F7E]/40">© 2026 VÖEL. TODOS OS DIREITOS RESERVADOS.</p>
        </div>
      </div>
    </footer>
  );
}

interface ProductDetailsModalProps {
  product: Product;
  isFavorite: boolean;
  selectedSize: string;
  selectedColor: string;
  onClose: () => void;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onToggleFavorite: (id: string) => void;
  onBuy: (product: Product, options?: PurchaseOptions) => void;
}

function ProductDetailsModal({
  product,
  isFavorite,
  selectedSize,
  selectedColor,
  onClose,
  onSizeChange,
  onColorChange,
  onToggleFavorite,
  onBuy,
}: ProductDetailsModalProps) {
  const installmentText = getInstallmentText(product);
  const galleryImages = useMemo(() => getProductGalleryImages(product, selectedColor), [product, selectedColor]);
  const hasMultipleImages = galleryImages.length > 1;
  const stockNotice = getStockNotice(product);
  const outOfStock = isOutOfStock(product);
  const maxQuantity = outOfStock ? 1 : Math.max(1, Math.floor(Number(product.stockQuantity) || 1));
  const maxInstallments = Math.max(1, Math.floor(Number(product.maxInstallments) || 1));
  const canChooseInstallments = !outOfStock && maxInstallments > 1;
  const [purchaseError, setPurchaseError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [shippingCep, setShippingCep] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [selectedInstallments, setSelectedInstallments] = useState(2);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const selectedInstallmentCount = Math.min(Math.max(2, selectedInstallments), Math.max(2, maxInstallments));
  const subtotal = product.price * quantity;
  const installmentValue = subtotal / selectedInstallmentCount;
  const selectedImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? '';

  useEffect(() => {
    setPurchaseError('');
    setQuantity(1);
    setShippingCep('');
    setPaymentMode('cash');
    setSelectedInstallments(2);
    setActiveImageIndex(0);
    setIsZooming(false);
    setZoomPosition({ x: 50, y: 50 });
    setIsLightboxOpen(false);
  }, [product.id]);

  useEffect(() => {
    setQuantity(previous => Math.min(Math.max(1, previous), maxQuantity));
  }, [maxQuantity]);

  useEffect(() => {
    setActiveImageIndex(0);
    setPurchaseError('');
    setIsZooming(false);
    setZoomPosition({ x: 50, y: 50 });
    setIsLightboxOpen(false);
  }, [selectedColor]);

  useEffect(() => {
    setPurchaseError('');
  }, [selectedSize]);

  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryImages.length]);

  useEffect(() => {
    setIsZooming(false);
    setZoomPosition({ x: 50, y: 50 });
  }, [selectedImage]);

  const handleColorSelect = (color: string) => {
    setPurchaseError('');
    onColorChange(selectedColor === color ? '' : color);
  };

  const handleSizeSelect = (size: string) => {
    setPurchaseError('');
    onSizeChange(selectedSize === size ? '' : size);
  };

  const handleQuantityChange = (nextQuantity: number) => {
    setPurchaseError('');
    setQuantity(Math.min(maxQuantity, Math.max(1, nextQuantity)));
  };

  const handleCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setShippingCep(formatCepInput(event.target.value));
  };

  const handlePaymentModeChange = (nextPaymentMode: PaymentMode) => {
    setPurchaseError('');
    setPaymentMode(nextPaymentMode);
  };

  const canUseHoverZoom = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const handleZoomEnter = () => {
    if (canUseHoverZoom()) {
      setIsZooming(true);
    }
  };

  const handleZoomMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!canUseHoverZoom()) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleZoomLeave = () => {
    setIsZooming(false);
  };

  const handlePreviousImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex(previous => previous === 0 ? galleryImages.length - 1 : previous - 1);
  };

  const handleNextImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex(previous => previous === galleryImages.length - 1 ? 0 : previous + 1);
  };

  const handleBuyClick = () => {
    if (!outOfStock && product.availableSizes.length > 0 && !selectedSize) {
      setPurchaseError('Selecione um tamanho para continuar.');
      return;
    }

    if (!outOfStock && product.availableColors.length > 0 && !selectedColor) {
      setPurchaseError('Selecione uma cor para continuar.');
      return;
    }

    setPurchaseError('');
    onBuy(product, {
      size: selectedSize,
      color: selectedColor,
      quantity,
      cep: shippingCep.trim(),
      paymentMode: canChooseInstallments && paymentMode === 'installments' ? 'installments' : 'cash',
      installments: canChooseInstallments && paymentMode === 'installments' ? selectedInstallmentCount : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 px-0 backdrop-blur-sm sm:items-center sm:px-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} type="button" aria-label="Fechar detalhe" />

      <section className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-lg bg-[#FDFCF7] shadow-2xl sm:max-w-5xl sm:rounded-lg">
        <div className="grid gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
          <div className="min-w-0 bg-[#F5F1EC]">
            <div className="relative">
              <button
                onClick={() => setIsLightboxOpen(true)}
                onMouseEnter={handleZoomEnter}
                onMouseLeave={handleZoomLeave}
                onMouseMove={handleZoomMove}
                className="relative flex h-[54dvh] min-h-[260px] w-full max-h-[430px] cursor-zoom-in items-center justify-center overflow-hidden bg-[#F5F1EC] text-left sm:h-[62dvh] sm:max-h-[560px] md:h-[72dvh] md:min-h-[420px] md:max-h-[680px] lg:cursor-crosshair"
                type="button"
                aria-label="Ampliar imagem do produto"
              >
                <ImageWithFallback
                  src={selectedImage}
                  alt={product.name}
                  className="h-full max-h-full w-full max-w-full object-contain object-center"
                />
                <div
                  className={`pointer-events-none absolute inset-0 hidden items-center justify-center overflow-hidden bg-[#F5F1EC] transition-opacity duration-150 lg:flex ${isZooming ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                >
                  <ImageWithFallback
                    src={selectedImage}
                    alt=""
                    className="h-full max-h-full w-full max-w-full object-contain object-center will-change-transform"
                    style={{
                      transform: `scale(${productZoomScale})`,
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                  />
                </div>
                <span className="absolute bottom-4 right-4 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3D3835] shadow-sm backdrop-blur-md md:hidden">
                  Toque para ampliar
                </span>
              </button>

              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3D3835] shadow-md backdrop-blur-md transition-colors hover:bg-white"
                    type="button"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3D3835] shadow-md backdrop-blur-md transition-colors hover:bg-white"
                    type="button"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3D3835] shadow-sm backdrop-blur-md">
                    {activeImageIndex + 1}/{galleryImages.length}
                  </span>
                </>
              )}

              {product.tag !== 'Nenhuma' && (
                <div className="absolute left-4 top-4 rounded-full bg-[#8B7355] px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                  {product.tag}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain border-t border-[#E5E0D8] bg-[#FDFCF7] p-3">
                {galleryImages.map((imageUrl, imageIndex) => (
                  <button
                    key={`${imageUrl}-${imageIndex}`}
                    onClick={() => setActiveImageIndex(imageIndex)}
                    className={`h-16 w-12 shrink-0 overflow-hidden rounded-md border transition-colors sm:h-20 sm:w-16 ${
                      activeImageIndex === imageIndex
                        ? 'border-[#8B7355]'
                        : 'border-[#D8D0C4] hover:border-[#8B7355]'
                    }`}
                    type="button"
                    aria-label={`Ver imagem ${imageIndex + 1}`}
                  >
                    <ImageWithFallback
                      src={imageUrl}
                      alt={`${product.name} miniatura ${imageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9B8F7E]">{product.category}</p>
                <h2 className="font-serif text-2xl uppercase tracking-[0.16em] text-[#3D3835] sm:text-3xl">{product.name}</h2>
                {product.sku && (
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#9B8F7E]">SKU {product.sku}</p>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F1EC] text-[#3D3835] transition-colors hover:bg-[#E5E0D8]"
                type="button"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-8 space-y-2 border-b border-[#E5E0D8] pb-8">
              <p className="text-xl font-semibold tracking-widest text-[#3D3835]">{formatCurrency(product.price)}</p>
              {installmentText && (
                <p className="text-sm text-[#8B7355]">{installmentText}</p>
              )}
              {stockNotice && (
                <p className={`text-sm font-semibold ${outOfStock ? 'text-red-700' : 'text-amber-700'}`}>{stockNotice}</p>
              )}
            </div>

            {product.availableColors.length > 0 && (
              <div className="mb-7 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Cores disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                        selectedColor === color
                          ? 'border-[#8B7355] bg-[#8B7355] text-white'
                          : 'border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'
                      }`}
                      type="button"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.availableSizes.length > 0 && (
              <div className="mb-7 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Tamanhos disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => handleSizeSelect(size)}
                      className={`min-w-12 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                        selectedSize === size
                          ? 'border-[#8B7355] bg-[#8B7355] text-white'
                          : 'border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'
                      }`}
                      type="button"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!outOfStock && (
              <div className="mb-7 space-y-6 border-y border-[#E5E0D8] py-6">
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Quantidade</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7355]">Subtotal {formatCurrency(subtotal)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8D0C4] bg-white text-lg font-light text-[#3D3835] transition-colors hover:border-[#8B7355] disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      aria-label="Diminuir quantidade"
                    >
                      -
                    </button>
                    <span className="flex h-11 min-w-16 items-center justify-center border-y border-[#E5E0D8] px-4 text-sm font-semibold tracking-[0.2em] text-[#3D3835]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= maxQuantity}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8D0C4] bg-white text-lg font-light text-[#3D3835] transition-colors hover:border-[#8B7355] disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]" htmlFor={`shipping-cep-${product.id}`}>
                    CEP para cálculo do frete
                  </label>
                  <input
                    id={`shipping-cep-${product.id}`}
                    value={shippingCep}
                    onChange={handleCepChange}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                    placeholder="00000-000"
                    className="h-12 w-full rounded-lg border border-[#D8D0C4] bg-white px-4 text-sm tracking-[0.18em] text-[#3D3835] outline-none transition-colors placeholder:text-[#C7BFB5] focus:border-[#8B7355]"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Forma de pagamento</p>
                  <div className={`grid gap-2 ${canChooseInstallments ? 'sm:grid-cols-2' : ''}`}>
                    <button
                      onClick={() => handlePaymentModeChange('cash')}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                        paymentMode === 'cash'
                          ? 'border-[#8B7355] bg-[#8B7355] text-white'
                          : 'border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'
                      }`}
                      type="button"
                    >
                      À vista
                      {paymentMode === 'cash' && <Check size={15} />}
                    </button>

                    {canChooseInstallments && (
                      <button
                        onClick={() => handlePaymentModeChange('installments')}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                          paymentMode === 'installments'
                            ? 'border-[#8B7355] bg-[#8B7355] text-white'
                            : 'border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'
                        }`}
                        type="button"
                      >
                        Parcelado
                        {paymentMode === 'installments' && <Check size={15} />}
                      </button>
                    )}
                  </div>

                  {canChooseInstallments && paymentMode === 'installments' && (
                    <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
                      <select
                        value={selectedInstallmentCount}
                        onChange={(event) => setSelectedInstallments(Number(event.target.value))}
                        className="h-12 rounded-lg border border-[#D8D0C4] bg-white px-4 text-sm font-semibold tracking-[0.12em] text-[#3D3835] outline-none transition-colors focus:border-[#8B7355]"
                        aria-label="Quantidade de parcelas"
                      >
                        {Array.from({ length: maxInstallments - 1 }, (_, index) => index + 2).map(installmentCount => (
                          <option key={installmentCount} value={installmentCount}>{installmentCount}x</option>
                        ))}
                      </select>
                      <p className="text-xs leading-relaxed tracking-wide text-[#8B7355]">
                        aprox. {formatCurrency(installmentValue)} por parcela
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6 text-sm leading-relaxed tracking-wide text-[#7A7067]">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Descrição</p>
                <p>{product.description}</p>
              </div>

              {product.details && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A7067]">Detalhes</p>
                  <p>{product.details}</p>
                </div>
              )}
            </div>

            {purchaseError && (
              <p className="mt-8 rounded-lg bg-[#F5F1EC] px-4 py-3 text-center text-xs tracking-wide text-[#8B7355]">
                {purchaseError}
              </p>
            )}

            <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                onClick={handleBuyClick}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#8B7355] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-colors hover:bg-[#6D5A42]"
                type="button"
              >
                <MessageCircle size={16} /> {outOfStock ? 'Consultar reposição pelo WhatsApp' : 'Comprar pelo WhatsApp'}
              </button>

              <button
                onClick={() => onToggleFavorite(product.id)}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#D8D0C4] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#3D3835] transition-colors hover:border-[#8B7355] hover:text-[#8B7355]"
                type="button"
              >
                <Heart size={16} fill={isFavorite ? '#8B7355' : 'none'} className={isFavorite ? 'text-[#8B7355]' : ''} />
                {isFavorite ? 'Favorito' : 'Favoritar'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1F1B18]/90 p-3 sm:p-4">
          <button className="absolute inset-0 cursor-default" onClick={() => setIsLightboxOpen(false)} type="button" aria-label="Fechar imagem ampliada" />
          <div className="relative flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl items-center justify-center sm:h-[calc(100dvh-2rem)]">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#3D3835] shadow-lg backdrop-blur-md transition-colors hover:bg-white"
              type="button"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <ImageWithFallback
              src={selectedImage}
              alt={`${product.name} ampliado`}
              className="max-h-full max-w-full rounded-lg object-contain object-center shadow-2xl"
              style={{ touchAction: 'pinch-zoom' }}
            />
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3D3835] shadow-lg backdrop-blur-md transition-colors hover:bg-white"
                  type="button"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3D3835] shadow-lg backdrop-blur-md transition-colors hover:bg-white"
                  type="button"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const storedFavorites = window.localStorage.getItem(favoriteStorageKey);
      const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
      return Array.isArray(parsedFavorites) ? parsedFavorites.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Destaques');
  const [activePage, setActivePage] = useState('loja');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetchPublicCatalog()
      .then(catalog => {
        if (!isMounted) return;
        setProducts(catalog.products);
        setCategories(catalog.categories);
        setLoadError('');
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError('Não foi possível carregar o catálogo agora.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (products.length === 0) return;
    const productIds = new Set(products.map(product => product.id));
    setFavorites(previous => previous.filter(id => productIds.has(id)));
  }, [products]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const categoryIdsWithProducts = new Set(products.map(product => product.categoryId).filter(Boolean));
    const visibleCategories = categories.filter(category => category.isActive && categoryIdsWithProducts.has(category.id));

    return [
      { label: 'Destaques', value: 'Destaques' },
      { label: 'Todos', value: 'Todos' },
      ...visibleCategories.map(category => ({ label: category.name, value: category.id })),
    ];
  }, [categories, products]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategory === 'Destaques' || activeCategory === 'Todos') return activeCategory;
    return categories.find(category => category.id === activeCategory)?.name ?? activeCategory;
  }, [activeCategory, categories]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setActivePage('loja');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(previous => previous.includes(id) ? previous.filter(favorite => favorite !== id) : [...previous, id]);
  };

  const handlePageChange = (page: string, category = 'Destaques') => {
    setActivePage(page);
    setActiveCategory(category);
    setShowFavorites(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowFavorites = () => {
    setShowFavorites(true);
    setActivePage('loja');
    setActiveCategory('Todos');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setSelectedColor('');
  };

  const handleBuyNow = (product: Product, options?: PurchaseOptions) => {
    const outOfStock = isOutOfStock(product);
    const quantity = outOfStock ? 1 : Math.max(1, Math.floor(Number(options?.quantity) || 1));
    const subtotal = product.price * quantity;
    const maxInstallments = Math.max(1, Math.floor(Number(product.maxInstallments) || 1));
    const isInstallmentPayment = !outOfStock && options?.paymentMode === 'installments' && maxInstallments > 1;
    const installmentCount = isInstallmentPayment
      ? Math.min(Math.max(2, Math.floor(Number(options?.installments) || 2)), maxInstallments)
      : undefined;
    const paymentDescription = isInstallmentPayment && installmentCount
      ? `Parcelado em ${installmentCount}x de aproximadamente ${formatCurrency(subtotal / installmentCount)}`
      : 'À vista';
    const finalMessage = outOfStock
      ? 'Poderia me avisar sobre disponibilidade?'
      : isInstallmentPayment
        ? 'Pode gerar o link de crédito para pagamento?'
        : 'Pode me passar o PIX para pagamento?';

    const message = [
      outOfStock ? 'Olá! Gostaria de consultar reposição do produto:' : 'Olá! Tenho interesse no produto:',
      `Produto: ${product.name}`,
      `Preço unitário: ${formatCurrency(product.price)}`,
      `Quantidade: ${quantity}`,
      `Subtotal: ${formatCurrency(subtotal)}`,
      product.category ? `Categoria: ${product.category}` : '',
      options?.color ? `Cor selecionada: ${options.color}` : '',
      options?.size ? `Tamanho selecionado: ${options.size}` : '',
      product.sku ? `SKU: ${product.sku}` : '',
      !outOfStock ? `Forma de pagamento desejada: ${paymentDescription}` : '',
      options?.cep ? `CEP: ${options.cep}` : '',
      `Link: ${getProductLink(product)}`,
      outOfStock ? 'Estoque: Esgotado' : '',
      finalMessage,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppChat = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Preciso de atendimento.')}`, '_blank');
  };

  const baseProducts = useMemo(() => {
    if (showFavorites) {
      return products.filter(product => favorites.includes(product.id));
    }

    if (activeCategory === 'Destaques') return products.filter(product => product.tag === 'Destaque');
    if (activeCategory === 'Todos') return products;
    return products.filter(product => product.categoryId === activeCategory);
  }, [activeCategory, favorites, products, showFavorites]);

  const filteredProducts = useMemo(() => {
    const query = normalizeText(searchQuery.trim());

    if (!query) return baseProducts;

    return baseProducts.filter(product =>
      normalizeText(product.name).includes(query) ||
      normalizeText(product.category).includes(query) ||
      normalizeText(product.description).includes(query) ||
      normalizeText(product.tag).includes(query)
    );
  }, [baseProducts, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const productGridClass = useMemo(() => {
    const baseClass = 'grid grid-cols-1 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16';

    if (filteredProducts.length === 1) {
      return `${baseClass} mx-auto max-w-[22rem]`;
    }

    if (filteredProducts.length === 2) {
      return `${baseClass} mx-auto max-w-[46rem] md:grid-cols-2`;
    }

    if (filteredProducts.length === 3) {
      return `${baseClass} mx-auto max-w-[70rem] md:grid-cols-2 lg:grid-cols-3`;
    }

    return `${baseClass} md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`;
  }, [filteredProducts.length]);

  const isHero = !showFavorites && activeCategory === 'Destaques' && !hasSearch && activePage === 'loja';

  return (
    <div className="min-h-screen bg-[#FDFCF7] font-sans text-[#3D3835] selection:bg-[#8B7355]/20">
      <Header
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        favoritesCount={favorites.length}
        onShowFavorites={handleShowFavorites}
        onPageChange={handlePageChange}
        activePage={activePage}
        activeCategory={activeCategory}
        menuItems={menuItems}
      />

      <main>
        {activePage === 'loja' ? (
          <>
            {isHero && (
              <section className="relative h-[90vh] w-full overflow-hidden bg-[#F5F1EC]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000"
                  alt="Nova Coleção"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 text-white">
                  <h1 className="mb-4 px-4 text-center font-serif text-5xl uppercase tracking-[0.2em] drop-shadow-lg md:text-7xl">VÖEL Brand</h1>
                  <p className="mb-10 text-sm font-light uppercase tracking-[0.4em] drop-shadow-md md:text-lg">A essência do minimalismo</p>
                  <button
                    onClick={() => document.getElementById('vitrine')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group flex items-center gap-3 rounded-full bg-white px-10 py-4 text-xs uppercase tracking-[0.3em] text-[#3D3835] transition-all duration-500 hover:bg-[#3D3835] hover:text-white"
                    type="button"
                  >
                    Ver Vitrine <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </section>
            )}

            <div className={isHero ? '' : 'pt-32 md:pt-24'}>
              <section id="vitrine" className="container mx-auto px-4 py-14 md:py-20">
                <div className="mx-auto mb-12 max-w-4xl text-center md:mb-16">
                  <h2 className="mb-3 break-words font-serif text-2xl uppercase tracking-[0.2em] sm:text-3xl sm:tracking-[0.3em]">
                    {showFavorites
                      ? 'Meus Favoritos'
                      : activeCategory === 'Todos'
                        ? 'Todos'
                        : activeCategoryLabel}
                  </h2>
                  <p className="text-[10px] font-light uppercase tracking-[0.35em] text-[#9B8F7E] sm:tracking-[0.5em]">
                    {isLoading
                      ? 'Carregando vitrine'
                      : showFavorites
                        ? `${filteredProducts.length} favoritos salvos`
                        : 'Peças exclusivas selecionadas para você'}
                  </p>
                  <div className="mx-auto mt-8 h-px w-12 bg-[#8B7355] opacity-40" />
                </div>

                {loadError && (
                  <div className="mx-auto mb-10 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                    {loadError}
                  </div>
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 md:gap-x-8 lg:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-5">
                        <div className="aspect-[3/4] animate-pulse rounded-lg bg-[#F5F1EC]" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-[#E5E0D8]" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E0D8]" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className={productGridClass}>
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="group cursor-pointer"
                        onClick={() => openProductDetails(product)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openProductDetails(product);
                          }
                        }}
                      >
                        <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-lg border border-[#E5E0D8]/30 bg-[#F5F1EC] shadow-sm md:mb-6">
                          <ImageWithFallback
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                          />

                          <button
                            onClick={(event) => { event.stopPropagation(); toggleFavorite(product.id); }}
                            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[#3D3835] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-[#8B7355] md:right-4 md:top-4 md:opacity-0 md:group-hover:opacity-100"
                            type="button"
                            aria-label={favorites.includes(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            <Heart size={16} fill={favorites.includes(product.id) ? '#8B7355' : 'none'} className={favorites.includes(product.id) ? 'text-[#8B7355]' : 'text-[#3D3835]'} />
                          </button>

                          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-300 md:inset-x-4 md:bottom-4 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                            <button
                              onClick={(event) => { event.stopPropagation(); openProductDetails(product); }}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8B7355] py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-colors hover:bg-[#6D5A42]"
                              type="button"
                            >
                              <MessageCircle size={14} /> {isOutOfStock(product) ? 'Consultar reposição' : 'Comprar agora'}
                            </button>
                          </div>

                          {product.tag !== 'Nenhuma' && (
                            <div className="absolute left-3 top-3 rounded-full bg-[#8B7355] px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white md:left-4 md:top-4">
                              {product.tag}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 px-1">
                          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#9B8F7E]">{product.category}</p>
                          <h3 className="text-sm font-light tracking-[0.1em] text-[#3D3835] transition-colors group-hover:text-[#8B7355]">{product.name}</h3>
                          <p className="text-[10px] leading-relaxed tracking-wide text-[#9B8F7E]">{product.description}</p>
                          <p className="pt-1 text-xs font-semibold tracking-widest text-[#3D3835]">{formatCurrency(product.price)}</p>
                          {product.maxInstallments > 1 && (
                            <p className="text-[10px] tracking-wide text-[#8B7355]">{getInstallmentText(product)}</p>
                          )}
                          {getStockNotice(product) && (
                            <p className={`text-[10px] font-semibold tracking-wide ${isOutOfStock(product) ? 'text-red-700' : 'text-amber-700'}`}>
                              {getStockNotice(product)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 py-20 text-center">
                    <p className="text-sm tracking-wide text-[#9B8F7E]">
                      {hasSearch
                        ? 'Nenhuma peça encontrada para sua busca.'
                        : showFavorites
                          ? 'Nenhum favorito salvo.'
                          : 'Nenhum item encontrado.'}
                    </p>
                    {!hasSearch && (
                      <button
                        onClick={() => { setSearchQuery(''); setActiveCategory('Todos'); setShowFavorites(false); setActivePage('loja'); }}
                        className="text-xs uppercase tracking-widest text-[#8B7355] underline underline-offset-4"
                        type="button"
                      >
                        Ver toda a coleção
                      </button>
                    )}
                  </div>
                )}

                {isHero && !isLoading && (
                  <div className="mt-32 grid grid-cols-1 gap-16 rounded-lg border-t border-[#E5E0D8]/40 bg-[#F5F1EC]/30 py-20 md:grid-cols-3">
                    {[
                      { Icon: Check, title: 'Qualidade Premium', text: 'Materiais selecionados e acabamento impecável em cada detalhe das nossas peças.' },
                      { Icon: Zap, title: 'Entrega Rápida', text: 'Receba as suas peças favoritas em até 3 dias úteis com envio prioritário para todo o país.' },
                      { Icon: Heart, title: 'Troca Garantida', text: 'Até 30 dias para trocar ou devolver a sua compra sem burocracias, com suporte total.' },
                    ].map(({ Icon, title, text }) => (
                      <div key={title} className="group flex flex-col items-center px-6 text-center">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#8B7355]/30 transition-colors group-hover:bg-[#8B7355]/10">
                          <Icon className="text-[#8B7355]" size={24} />
                        </div>
                        <h4 className="mb-4 font-serif text-sm uppercase tracking-[0.3em]">{title}</h4>
                        <p className="text-[11px] leading-relaxed tracking-widest text-[#9B8F7E]">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <section className="container mx-auto max-w-6xl px-4 py-32">
            <div className="grid items-center gap-20 md:grid-cols-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800"
                  alt="Sobre VÖEL"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#8B7355]/5" />
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#8B7355]">Nossa História</span>
                  <h2 className="font-serif text-4xl uppercase tracking-[0.2em]">O conceito VÖEL</h2>
                </div>
                <div className="space-y-6 text-sm font-light leading-relaxed tracking-wide text-[#7A7067] sm:text-base">
                  <p>A VÖEL nasceu do desejo de criar uma moda que celebra a essência feminina através de peças atemporais, fluidas e sofisticadas.</p>
                  <p>Cada detalhe, da escolha das fibras naturais ao acabamento manual, é pensado para a mulher que valoriza o conforto sem abrir mão da elegância minimalista.</p>
                  <p>O nosso compromisso é com a moda consciente: poucas peças, altíssima qualidade e um design que transcende as estações passageiras.</p>
                  <p className="border-t border-[#E5E0D8]/40 pt-6 font-serif text-lg italic text-[#8B7355]">"Moda que transcende tendências e celebra a sua essência."</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <CatalogFooter onWhatsAppChat={handleWhatsAppChat} />

      <button
        onClick={handleWhatsAppChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#1ebe5d]"
        aria-label="WhatsApp"
        type="button"
      >
        <MessageCircle size={26} />
      </button>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isFavorite={favorites.includes(selectedProduct.id)}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onClose={() => setSelectedProduct(null)}
          onSizeChange={setSelectedSize}
          onColorChange={setSelectedColor}
          onToggleFavorite={toggleFavorite}
          onBuy={handleBuyNow}
        />
      )}
    </div>
  );
}
