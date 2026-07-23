export type ProductTag = 'Destaque' | 'Novo' | 'Sale' | 'Exclusivo' | 'Nenhuma';

export const productTags: ProductTag[] = ['Destaque', 'Novo', 'Sale', 'Exclusivo', 'Nenhuma'];

export type ProductColorImageValue = string | string[];

export type ProductColorImages = Record<string, ProductColorImageValue>;

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
