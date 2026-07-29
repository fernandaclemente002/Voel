export type ProductTag = string;

export const defaultProductTags: ProductTag[] = ['Destaque', 'Novo', 'Promoção', 'Sale', 'Exclusivo'];

export type ProductColorImageGroup = {
  images?: string[];
  details?: string[];
};

export type ProductColorImageValue = string | string[] | ProductColorImageGroup;

export type ProductColorImages = Record<string, ProductColorImageValue>;

export type SiteBannerTargetType =
  | 'all'
  | 'featured'
  | 'tag'
  | 'category'
  | 'external';

export type SiteBannerImageFit = 'cover' | 'contain';

export type SiteBannerContentPosition = 'center' | 'bottom_center' | 'bottom_left' | 'bottom_right';

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  menuOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string | null;
  category: string;
  categorySlug?: string;
  tag: ProductTag;
  tags?: ProductTag[];
  imageUrl: string;
  imagePath?: string | null;
  maxInstallments: number;
  availableSizes: string[];
  availableColors: string[];
  colorImages: ProductColorImages;
  sku?: string | null;
  details?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogData {
  categories: Category[];
  products: Product[];
  productTags: ProductTagRecord[];
  siteBanners: SiteBanner[];
  siteSettings: SiteSettings;
  source: 'supabase' | 'fallback';
}

export interface CategoryInput {
  name: string;
  slug: string;
  isActive: boolean;
  menuOrder: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string | null;
  tag: ProductTag;
  tags?: ProductTag[];
  imageUrl: string;
  imagePath?: string | null;
  maxInstallments: number;
  availableSizes: string[];
  availableColors: string[];
  colorImages: ProductColorImages;
  sku?: string | null;
  details?: string | null;
  isActive: boolean;
}

export interface ProductTagRecord {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTagInput {
  name: string;
  active: boolean;
  sortOrder: number;
}

export interface SiteBanner {
  id: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  textColor?: string | null;
  imageFit: SiteBannerImageFit;
  contentPosition: SiteBannerContentPosition;
  showText: boolean;
  buttonEnabled: boolean;
  buttonLabel?: string | null;
  targetType: SiteBannerTargetType;
  targetValue?: string | null;
  externalUrl?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteBannerInput {
  id?: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  textColor?: string | null;
  imageFit: SiteBannerImageFit;
  contentPosition: SiteBannerContentPosition;
  showText: boolean;
  buttonEnabled: boolean;
  buttonLabel?: string | null;
  targetType: SiteBannerTargetType;
  targetValue?: string | null;
  externalUrl?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface SiteSettings {
  id: string;
  contactEmail: string;
  whatsappNumber: string;
  instagramUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettingsInput {
  contactEmail: string;
  whatsappNumber: string;
  instagramUrl: string;
}

export const defaultSiteSettings: SiteSettings = {
  id: 'site',
  contactEmail: 'voel.levezaeessencia@gmail.com',
  whatsappNumber: '5511930224490',
  instagramUrl: 'https://www.instagram.com/voel.oficial',
};
