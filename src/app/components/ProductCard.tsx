import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  isNew?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

export function ProductCard({
  id,
  name,
  price,
  category,
  description,
  imageUrl,
  isNew,
  isFavorite,
  onToggleFavorite
}: ProductCardProps) {
  const whatsappMessage = `Olá! Tenho interesse no produto: ${name} - R$ ${price.toFixed(2)}`;
  const whatsappLink = `https://wa.me/5511930224490?text=${encodeURIComponent(whatsappMessage)}`;

  const handleImageClick = () => {
    window.open(whatsappLink, '_blank');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  return (
    <div className="group">
      <div
        className="relative overflow-hidden bg-[#F5F1EC] aspect-[3/4] mb-4 rounded-lg cursor-pointer"
        onClick={handleImageClick}
      >
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {isNew && (
          <span className="absolute top-4 left-4 bg-[#8B7355] text-white px-3 py-1.5 text-xs rounded-full">
            NOVO
          </span>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-2.5 bg-white/95 rounded-full hover:bg-white transition-all shadow-sm"
        >
          <Heart
            size={18}
            className={isFavorite ? 'fill-[#8B7355] stroke-[#8B7355]' : 'stroke-[#3D3835]'}
          />
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-[#9B8F7E] uppercase tracking-wider">{category}</p>
        <h3 className="text-[#3D3835]">{name}</h3>
        <p className="text-sm text-[#9B8F7E] leading-relaxed line-clamp-2">{description}</p>
        <p className="text-[#8B7355] pt-1">R$ {price.toFixed(2)}</p>
      </div>
    </div>
  );
}
