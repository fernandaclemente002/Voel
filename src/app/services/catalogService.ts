import { fallbackCatalog } from '../data/fallbackCatalog';
import { isSupabaseConfigured, productImagesBucket, requireSupabase, supabase } from '../lib/supabase';
import type { CatalogData, Category, CategoryInput, Product, ProductInput, ProductTag } from '../types/catalog';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  menu_order: number | null;
  created_at?: string;
  updated_at?: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  stock_quantity: number | null;
  category_id: string | null;
  tag: ProductTag | null;
  image_url: string | null;
  image_path: string | null;
  max_installments: number | null;
  available_sizes: string[] | null;
  available_colors: string[] | null;
  color_images: unknown;
  sku: string | null;
  details: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    menuOrder: row.menu_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeColorImages(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((images, [color, imageUrl]) => {
    const normalizedColor = color.trim();
    const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';

    if (normalizedColor && normalizedImageUrl) {
      images[normalizedColor] = normalizedImageUrl;
    }

    return images;
  }, {});
}

function uniqueTextValues(values: string[]) {
  return values.reduce<string[]>((uniqueValues, value) => {
    const trimmed = value.trim();
    if (!trimmed) return uniqueValues;

    const normalizedValue = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const alreadyExists = uniqueValues.some(existing => (
      existing
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase() === normalizedValue
    ));

    return alreadyExists ? uniqueValues : [...uniqueValues, trimmed];
  }, []);
}

function mapProduct(row: ProductRow, categoriesById: Map<string, Category>): Product {
  const category = row.category_id ? categoriesById.get(row.category_id) : undefined;
  const colorImages = normalizeColorImages(row.color_images);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    stockQuantity: row.stock_quantity ?? 0,
    categoryId: row.category_id,
    category: category?.name ?? 'Sem categoria',
    categorySlug: category?.slug,
    tag: row.tag ?? 'Nenhuma',
    imageUrl: row.image_url ?? '',
    imagePath: row.image_path,
    maxInstallments: Math.max(1, Number(row.max_installments ?? 1)),
    availableSizes: row.available_sizes ?? [],
    availableColors: uniqueTextValues([...(row.available_colors ?? []), ...Object.keys(colorImages)]),
    colorImages,
    sku: row.sku,
    details: row.details,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCategoryPayload(input: CategoryInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    is_active: input.isActive,
    menu_order: Number(input.menuOrder) || 0,
  };
}

function toProductPayload(input: ProductInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price) || 0,
    stock_quantity: Number(input.stockQuantity) || 0,
    category_id: input.categoryId,
    tag: input.tag,
    image_url: input.imageUrl,
    image_path: input.imagePath ?? null,
    max_installments: Math.max(1, Number(input.maxInstallments) || 1),
    available_sizes: input.availableSizes,
    available_colors: input.availableColors,
    color_images: input.colorImages ?? {},
    sku: input.sku?.trim() || null,
    details: input.details?.trim() || null,
    is_active: input.isActive,
  };
}

export async function fetchPublicCatalog(): Promise<CatalogData> {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackCatalog;
  }

  const [{ data: categoryRows, error: categoriesError }, { data: productRows, error: productsError }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id,name,slug,is_active,menu_order,created_at,updated_at')
        .eq('is_active', true)
        .order('menu_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('products')
        .select('id,name,description,price,stock_quantity,category_id,tag,image_url,image_path,max_installments,available_sizes,available_colors,color_images,sku,details,is_active,created_at,updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);

  if (categoriesError) throw categoriesError;
  if (productsError) throw productsError;

  const categories = (categoryRows ?? []).map(mapCategory);
  const categoriesById = new Map(categories.map(category => [category.id, category]));
  const products = (productRows ?? [])
    .map(row => mapProduct(row, categoriesById))
    .filter(product => product.categoryId && categoriesById.has(product.categoryId));

  return {
    categories,
    products,
    source: 'supabase',
  };
}

export async function fetchAdminCatalog() {
  const client = requireSupabase();

  const [{ data: categoryRows, error: categoriesError }, { data: productRows, error: productsError }] =
    await Promise.all([
      client
        .from('categories')
        .select('id,name,slug,is_active,menu_order,created_at,updated_at')
        .order('menu_order', { ascending: true })
        .order('name', { ascending: true }),
      client
        .from('products')
        .select('id,name,description,price,stock_quantity,category_id,tag,image_url,image_path,max_installments,available_sizes,available_colors,color_images,sku,details,is_active,created_at,updated_at')
        .order('created_at', { ascending: false }),
    ]);

  if (categoriesError) throw categoriesError;
  if (productsError) throw productsError;

  const categories = (categoryRows ?? []).map(mapCategory);
  const categoriesById = new Map(categories.map(category => [category.id, category]));

  return {
    categories,
    products: (productRows ?? []).map(row => mapProduct(row, categoriesById)),
  };
}

export async function saveCategory(input: CategoryInput, categoryId?: string) {
  const client = requireSupabase();
  const payload = toCategoryPayload(input);

  if (categoryId) {
    const { error } = await client.from('categories').update(payload).eq('id', categoryId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from('categories').insert(payload);
  if (error) throw error;
}

export async function deleteCategory(categoryId: string) {
  const client = requireSupabase();
  const { error } = await client.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
}

export async function saveProduct(input: ProductInput, productId?: string) {
  const client = requireSupabase();
  const payload = toProductPayload(input);

  if (productId) {
    const { error } = await client.from('products').update(payload).eq('id', productId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from('products').insert(payload);
  if (error) throw error;
}

export async function updateProductStock(productId: string, stockQuantity: number) {
  const client = requireSupabase();
  const safeStockQuantity = Math.max(0, Math.floor(Number(stockQuantity) || 0));
  const { error } = await client
    .from('products')
    .update({ stock_quantity: safeStockQuantity })
    .eq('id', productId);

  if (error) throw error;
}

export async function deleteProduct(productId: string) {
  const client = requireSupabase();
  const { error } = await client.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export async function uploadProductImage(file: File) {
  const client = requireSupabase();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `products/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from(productImagesBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = client.storage.from(productImagesBucket).getPublicUrl(path);

  return {
    imagePath: path,
    imageUrl: data.publicUrl,
  };
}
