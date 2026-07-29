import { fallbackCatalog } from '../data/fallbackCatalog';
import { isSupabaseConfigured, productImagesBucket, requireSupabase, supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CatalogData,
  Category,
  CategoryInput,
  Product,
  ProductColorImages,
  ProductColorImageValue,
  ProductInput,
  ProductTag,
  ProductTagInput,
  ProductTagRecord,
  SiteBanner,
  SiteBannerContentPosition,
  SiteBannerImageFit,
  SiteBannerInput,
  SiteBannerTargetType,
  SiteSettings,
  SiteSettingsInput,
} from '../types/catalog';
import { defaultProductTags, defaultSiteSettings } from '../types/catalog';

export class CatalogMutationError extends Error {
  operation: string;
  table: string;
  payload: unknown;
  supabaseError: unknown;

  constructor(operation: string, table: string, payload: unknown, supabaseError: unknown) {
    super(`${operation} failed on ${table}`);
    this.name = 'CatalogMutationError';
    this.operation = operation;
    this.table = table;
    this.payload = payload;
    this.supabaseError = supabaseError;
  }
}

function throwLoggedSupabaseError(operation: string, table: string, payload: unknown, supabaseError: unknown): never {
  console.error('[Supabase mutation error]', {
    operation,
    table,
    payload,
    supabaseError,
  });

  throw new CatalogMutationError(operation, table, payload, supabaseError);
}

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
  tag: unknown;
  image_url: string | null;
  image_path: string | null;
  max_installments: number | null;
  available_sizes: unknown;
  available_colors: string[] | null;
  color_images: unknown;
  sku: string | null;
  details: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type SiteBannerRow = {
  id: string;
  image_url: string | null;
  title: string | null;
  subtitle: string | null;
  text_color: string | null;
  image_fit?: string | null;
  content_position?: string | null;
  show_text: boolean | null;
  button_enabled: boolean | null;
  button_label: string | null;
  target_type: string | null;
  target_value: string | null;
  external_url: string | null;
  sort_order: number | null;
  active: boolean | null;
  created_at?: string;
  updated_at?: string;
};

type ProductTagRow = {
  id: string;
  name: string;
  slug: string | null;
  active: boolean | null;
  sort_order: number | null;
  created_at?: string;
  updated_at?: string;
};

type SiteSettingsRow = {
  id: string;
  contact_email: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  created_at?: string;
  updated_at?: string;
};

const siteBannerTargetTypes: SiteBannerTargetType[] = [
  'all',
  'featured',
  'tag',
  'category',
  'external',
];

const siteBannerImageFits: SiteBannerImageFit[] = ['cover', 'contain'];
const siteBannerContentPositions: SiteBannerContentPosition[] = ['center', 'bottom_center', 'bottom_left', 'bottom_right'];
const siteBannerSelect = 'id,image_url,title,subtitle,text_color,image_fit,content_position,show_text,button_enabled,button_label,target_type,target_value,external_url,sort_order,active,created_at,updated_at';
const legacySiteBannerSelect = 'id,image_url,title,subtitle,text_color,show_text,button_enabled,button_label,target_type,target_value,external_url,sort_order,active,created_at,updated_at';
const complementaryImageGroupLabels = new Set([
  'costas',
  'detalhe',
  'detalhe da peca',
  'detalhe peca',
  'detalhes',
  'detalhes da peca',
  'detalhes peca',
  'details',
  'foto costas',
  'foto da lateral',
  'foto de costas',
  'foto de detalhe',
  'foto de detalhes',
  'foto de frente',
  'foto detalhe',
  'foto lateral',
  'fotos costas',
  'fotos de costas',
  'fotos de detalhe',
  'fotos de detalhes',
  'fotos de frente',
  'fotos detalhe',
  'fotos extras',
  'frente',
  'imagens extras',
  'lateral',
]);

function normalizeImageGroupLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isComplementaryImageGroupName(value: string) {
  return complementaryImageGroupLabels.has(normalizeImageGroupLabel(value));
}

function normalizeSiteBannerTargetType(value: string | null): SiteBannerTargetType {
  if (value === 'tag_new' || value === 'tag_promotion' || value === 'tag_sale') return 'tag';
  return siteBannerTargetTypes.includes(value as SiteBannerTargetType) ? value as SiteBannerTargetType : 'all';
}

function normalizeSiteBannerTargetValue(row: SiteBannerRow) {
  if (row.target_value) return row.target_value;
  if (row.target_type === 'tag_new') return 'Novo';
  if (row.target_type === 'tag_promotion') return 'Promoção';
  if (row.target_type === 'tag_sale') return 'Sale';
  return null;
}

function normalizeSiteBannerImageFit(value: string | null | undefined): SiteBannerImageFit {
  return siteBannerImageFits.includes(value as SiteBannerImageFit) ? value as SiteBannerImageFit : 'cover';
}

function normalizeSiteBannerContentPosition(value: string | null | undefined): SiteBannerContentPosition {
  return siteBannerContentPositions.includes(value as SiteBannerContentPosition) ? value as SiteBannerContentPosition : 'bottom_center';
}

function buildSiteBannerQuery(client: SupabaseClient, selectColumns: string, activeOnly: boolean) {
  let query = client
    .from('site_banners')
    .select(selectColumns);

  if (activeOnly) {
    query = query.eq('active', true);
  }

  return query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
}

async function fetchSiteBannerRows(client: SupabaseClient, activeOnly: boolean) {
  const result = await buildSiteBannerQuery(client, siteBannerSelect, activeOnly);
  if (!result.error) return result;

  return buildSiteBannerQuery(client, legacySiteBannerSelect, activeOnly);
}

function slugifyTag(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

function normalizeImageUrls(value: unknown) {
  if (typeof value === 'string') {
    const imageUrl = value.trim();
    return imageUrl ? [imageUrl] : [];
  }

  if (!Array.isArray(value)) return [];

  return value.reduce<string[]>((imageUrls, item) => {
    const imageUrl = typeof item === 'string' ? item.trim() : '';
    if (!imageUrl || imageUrls.includes(imageUrl)) return imageUrls;
    return [...imageUrls, imageUrl];
  }, []);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeColorImageValue(imageValue: unknown): ProductColorImageValue | null {
  if (isRecord(imageValue) && ('images' in imageValue || 'details' in imageValue)) {
    const images = normalizeImageUrls(imageValue.images);
    const details = normalizeImageUrls(imageValue.details);

    if (images.length === 0 && details.length === 0) return null;

    return {
      images,
      details,
    };
  }

  const imageUrls = normalizeImageUrls(imageValue);
  if (imageUrls.length === 0) return null;

  return imageUrls.length === 1 ? imageUrls[0] : imageUrls;
}

function getColorImageUrls(imageValue: ProductColorImageValue | undefined) {
  if (!imageValue) return [];

  if (typeof imageValue === 'string' || Array.isArray(imageValue)) {
    return normalizeImageUrls(imageValue);
  }

  return [
    ...normalizeImageUrls(imageValue.images),
    ...normalizeImageUrls(imageValue.details),
  ];
}

function normalizeColorImages(value: unknown): ProductColorImages {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<ProductColorImages>((images, [color, imageValue]) => {
    const normalizedColor = color.trim();
    const normalizedImageValue = normalizeColorImageValue(imageValue);

    if (normalizedColor && normalizedImageValue) {
      images[normalizedColor] = normalizedImageValue;
    }

    return images;
  }, {});
}

function getFirstColorImageUrl(colorImages: ProductColorImages) {
  for (const imageValue of Object.values(colorImages)) {
    const imageUrls = getColorImageUrls(imageValue);
    if (imageUrls.length > 0) return imageUrls[0];
  }

  return '';
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

function normalizeComparable(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeSizeLabel(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const comparable = normalizeComparable(trimmed);
  if (comparable === 'unico' || comparable === 'unica') return 'Único';
  return /^[a-z]+$/i.test(trimmed) ? trimmed.toUpperCase() : trimmed;
}

function normalizeProductSizes(value: unknown) {
  const rawSizes = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return rawSizes.reduce<string[]>((sizes, item) => {
    const normalizedSize = typeof item === 'string' ? normalizeSizeLabel(item) : '';
    if (!normalizedSize) return sizes;

    const alreadyExists = sizes.some(size => normalizeComparable(size) === normalizeComparable(normalizedSize));
    return alreadyExists ? sizes : [...sizes, normalizedSize];
  }, []);
}

function normalizeProductTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return uniqueTextValues(
    rawTags
      .map(tag => typeof tag === 'string' ? tag.trim() : '')
      .filter(tag => tag && tag !== 'Nenhuma')
  );
}

function mapProduct(row: ProductRow, categoriesById: Map<string, Category>): Product {
  const category = row.category_id ? categoriesById.get(row.category_id) : undefined;
  const colorImages = normalizeColorImages(row.color_images);
  const tags = normalizeProductTags(row.tag);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    stockQuantity: row.stock_quantity ?? 0,
    categoryId: row.category_id,
    category: category?.name ?? 'Sem categoria',
    categorySlug: category?.slug,
    tag: tags[0] ?? 'Nenhuma',
    tags,
    imageUrl: row.image_url?.trim() || getFirstColorImageUrl(colorImages),
    imagePath: row.image_path,
    maxInstallments: Math.max(1, Number(row.max_installments ?? 1)),
    availableSizes: normalizeProductSizes(row.available_sizes),
    availableColors: uniqueTextValues([...(row.available_colors ?? []), ...Object.keys(colorImages)])
      .filter(color => !isComplementaryImageGroupName(color)),
    colorImages,
    sku: row.sku,
    details: row.details,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSiteBanner(row: SiteBannerRow): SiteBanner {
  return {
    id: row.id,
    imageUrl: row.image_url?.trim() ?? '',
    title: row.title,
    subtitle: row.subtitle,
    textColor: row.text_color?.trim() || '#FFFFFF',
    imageFit: normalizeSiteBannerImageFit(row.image_fit),
    contentPosition: normalizeSiteBannerContentPosition(row.content_position),
    showText: row.show_text ?? false,
    buttonEnabled: row.button_enabled ?? false,
    buttonLabel: row.button_label,
    targetType: normalizeSiteBannerTargetType(row.target_type),
    targetValue: normalizeSiteBannerTargetValue(row),
    externalUrl: row.external_url,
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProductTag(row: ProductTagRow): ProductTagRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugifyTag(row.name),
    active: row.active ?? true,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getFallbackProductTags(): ProductTagRecord[] {
  return defaultProductTags.map((name, index) => ({
    id: `fallback-tag-${index}`,
    name,
    slug: slugifyTag(name),
    active: true,
    sortOrder: index,
  }));
}

function mergeProductTags(tagRows: ProductTagRecord[], products: Product[]) {
  const tagsBySlug = new Map<string, ProductTagRecord>();

  tagRows.forEach(tag => tagsBySlug.set(tag.slug, tag));

  products.forEach(product => {
    (product.tags?.length ? product.tags : [product.tag]).forEach(productTag => {
      if (!productTag || productTag === 'Nenhuma') return;
      const slug = slugifyTag(productTag);
      if (!tagsBySlug.has(slug)) {
        tagsBySlug.set(slug, {
          id: `legacy-tag-${slug}`,
          name: productTag,
          slug,
          active: true,
          sortOrder: 999,
        });
      }
    });
  });

  return Array.from(tagsBySlug.values()).sort((firstTag, secondTag) => (
    firstTag.sortOrder - secondTag.sortOrder || firstTag.name.localeCompare(secondTag.name)
  ));
}

function getPublicProductTags(tagRows: ProductTagRow[] | null, tagsError: unknown) {
  if (tagsError) return getFallbackProductTags();

  return (tagRows ?? [])
    .map(mapProductTag)
    .filter(tag => tag.active)
    .sort((firstTag, secondTag) => firstTag.sortOrder - secondTag.sortOrder || firstTag.name.localeCompare(secondTag.name));
}

function filterProductTagsByActiveTags(product: Product, activeTags: ProductTagRecord[]): Product {
  const activeSlugs = new Set(activeTags.filter(tag => tag.active).map(tag => tag.slug));
  const tags = (product.tags?.length ? product.tags : normalizeProductTags(product.tag))
    .filter(tag => activeSlugs.has(slugifyTag(tag)));

  return {
    ...product,
    tag: tags[0] ?? 'Nenhuma',
    tags,
  };
}

function fallbackBannerTargetForInactiveTags(banner: SiteBanner, activeTags: ProductTagRecord[]): SiteBanner {
  if (banner.targetType !== 'tag' || !banner.targetValue) return banner;

  const activeSlugs = new Set(activeTags.filter(tag => tag.active).map(tag => tag.slug));
  if (activeSlugs.has(slugifyTag(banner.targetValue))) return banner;

  return {
    ...banner,
    targetType: 'all',
    targetValue: null,
  };
}

function mapSiteSettings(row?: SiteSettingsRow | null): SiteSettings {
  if (!row) return defaultSiteSettings;

  return {
    id: row.id,
    contactEmail: row.contact_email?.trim() || defaultSiteSettings.contactEmail,
    whatsappNumber: row.whatsapp_number?.trim() || defaultSiteSettings.whatsappNumber,
    instagramUrl: row.instagram_url?.trim() || defaultSiteSettings.instagramUrl,
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
  const colorImages = normalizeColorImages(input.colorImages);
  const tags = uniqueTextValues(input.tags ?? [input.tag])
    .filter(tag => tag && tag !== 'Nenhuma');

  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price) || 0,
    stock_quantity: Number(input.stockQuantity) || 0,
    category_id: input.categoryId,
    tag: tags.length > 0 ? tags.join(', ') : 'Nenhuma',
    image_url: input.imageUrl,
    image_path: input.imagePath ?? null,
    max_installments: Math.max(1, Number(input.maxInstallments) || 1),
    available_sizes: normalizeProductSizes(input.availableSizes),
    available_colors: uniqueTextValues([...input.availableColors, ...Object.keys(colorImages)])
      .filter(color => !isComplementaryImageGroupName(color)),
    color_images: colorImages,
    sku: input.sku?.trim() || null,
    details: input.details?.trim() || null,
    is_active: input.isActive,
  };
}

function toSiteBannerPayload(input: SiteBannerInput) {
  return {
    image_url: input.imageUrl.trim(),
    title: input.title?.trim() || null,
    subtitle: input.subtitle?.trim() || null,
    text_color: input.textColor?.trim() || null,
    image_fit: input.imageFit,
    content_position: input.contentPosition,
    show_text: input.showText,
    button_enabled: input.buttonEnabled,
    button_label: input.buttonLabel?.trim() || null,
    target_type: input.targetType,
    target_value: input.targetValue?.trim() || null,
    external_url: input.externalUrl?.trim() || null,
    sort_order: Number(input.sortOrder) || 0,
    active: input.active,
  };
}

function toProductTagPayload(input: ProductTagInput) {
  const name = input.name.trim();

  return {
    name,
    slug: slugifyTag(name),
    active: input.active,
    sort_order: Number(input.sortOrder) || 0,
  };
}

function toSiteSettingsPayload(input: SiteSettingsInput) {
  return {
    id: defaultSiteSettings.id,
    contact_email: input.contactEmail.trim() || defaultSiteSettings.contactEmail,
    whatsapp_number: input.whatsappNumber.trim() || defaultSiteSettings.whatsappNumber,
    instagram_url: input.instagramUrl.trim() || defaultSiteSettings.instagramUrl,
  };
}

async function renameProductTagInProducts(client: SupabaseClient, previousName: string, nextName: string) {
  const { data: productRows, error: productsError } = await client
    .from('products')
    .select('id,tag');

  if (productsError) throw productsError;

  const previousSlug = slugifyTag(previousName);

  for (const productRow of productRows ?? []) {
    const currentTags = normalizeProductTags((productRow as { tag: unknown }).tag);
    const nextTags = currentTags.map(tag => slugifyTag(tag) === previousSlug ? nextName : tag);
    const changed = currentTags.some((tag, index) => tag !== nextTags[index]);

    if (!changed) continue;

    const { error } = await client
      .from('products')
      .update({ tag: uniqueTextValues(nextTags).join(', ') || 'Nenhuma' })
      .eq('id', (productRow as { id: string }).id);

    if (error) throw error;
  }
}

export async function fetchPublicCatalog(): Promise<CatalogData> {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackCatalog;
  }

  const [
    { data: categoryRows, error: categoriesError },
    { data: productRows, error: productsError },
    { data: tagRows, error: tagsError },
    { data: bannerRows, error: bannersError },
    { data: settingsRows, error: settingsError },
  ] =
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
      supabase
        .from('product_tags')
        .select('id,name,slug,active,sort_order,created_at,updated_at')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      fetchSiteBannerRows(supabase, true),
      supabase
        .from('site_settings')
        .select('id,contact_email,whatsapp_number,instagram_url,created_at,updated_at')
        .eq('id', defaultSiteSettings.id)
        .limit(1),
    ]);

  if (categoriesError) throw categoriesError;
  if (productsError) throw productsError;

  const categories = (categoryRows ?? []).map(mapCategory);
  const categoriesById = new Map(categories.map(category => [category.id, category]));
  const rawProducts = (productRows ?? [])
    .map(row => mapProduct(row, categoriesById))
    .filter(product => product.categoryId && categoriesById.has(product.categoryId));
  const productTags = getPublicProductTags(tagRows as ProductTagRow[] | null, tagsError);
  const products = rawProducts.map(product => filterProductTagsByActiveTags(product, productTags));

  const activeSiteBanners = bannersError
    ? fallbackCatalog.siteBanners
    : (bannerRows ?? [])
      .map(row => fallbackBannerTargetForInactiveTags(mapSiteBanner(row as SiteBannerRow), productTags))
      .filter(banner => banner.imageUrl);

  return {
    categories,
    products,
    productTags,
    siteBanners: activeSiteBanners.length > 0 ? activeSiteBanners : fallbackCatalog.siteBanners,
    siteSettings: settingsError ? defaultSiteSettings : mapSiteSettings((settingsRows ?? [])[0] as SiteSettingsRow | undefined),
    source: 'supabase',
  };
}

export async function fetchAdminCatalog() {
  const client = requireSupabase();

  const [
    { data: categoryRows, error: categoriesError },
    { data: productRows, error: productsError },
    { data: tagRows },
    { data: bannerRows },
    { data: settingsRows },
  ] =
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
      client
        .from('product_tags')
        .select('id,name,slug,active,sort_order,created_at,updated_at')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      fetchSiteBannerRows(client, false),
      client
        .from('site_settings')
        .select('id,contact_email,whatsapp_number,instagram_url,created_at,updated_at')
        .eq('id', defaultSiteSettings.id)
        .limit(1),
    ]);

  if (categoriesError) throw categoriesError;
  if (productsError) throw productsError;

  const categories = (categoryRows ?? []).map(mapCategory);
  const categoriesById = new Map(categories.map(category => [category.id, category]));
  const products = (productRows ?? []).map(row => mapProduct(row, categoriesById));

  return {
    categories,
    products,
    productTags: mergeProductTags((tagRows ?? []).map(row => mapProductTag(row as ProductTagRow)), products),
    siteBanners: (bannerRows ?? []).map(row => mapSiteBanner(row as SiteBannerRow)),
    siteSettings: mapSiteSettings((settingsRows ?? [])[0] as SiteSettingsRow | undefined),
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

export async function updateCategoryOrder(categoryIds: string[]) {
  const client = requireSupabase();

  for (const [index, categoryId] of categoryIds.entries()) {
    const { error } = await client
      .from('categories')
      .update({ menu_order: index })
      .eq('id', categoryId);

    if (error) throw error;
  }
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

export async function saveSiteBanner(input: SiteBannerInput) {
  const client = requireSupabase();
  const payload = toSiteBannerPayload(input);

  if (input.id) {
    const { error } = await client.from('site_banners').update(payload).eq('id', input.id);
    if (error) {
      throwLoggedSupabaseError('update site banner', 'site_banners', { id: input.id, ...payload }, error);
    }
    return;
  }

  const { error } = await client.from('site_banners').insert(payload);
  if (error) {
    throwLoggedSupabaseError('insert site banner', 'site_banners', payload, error);
  }
}

export async function deleteSiteBanner(bannerId: string) {
  const client = requireSupabase();
  const { error } = await client.from('site_banners').delete().eq('id', bannerId);
  if (error) {
    throwLoggedSupabaseError('delete site banner', 'site_banners', { id: bannerId }, error);
  }
}

export async function updateSiteBannerOrder(bannerIds: string[]) {
  const client = requireSupabase();

  for (const [index, bannerId] of bannerIds.entries()) {
    const { error } = await client
      .from('site_banners')
      .update({ sort_order: index })
      .eq('id', bannerId);

    if (error) throw error;
  }
}

export async function saveProductTag(input: ProductTagInput, tagId?: string, previousName?: string) {
  const client = requireSupabase();
  const payload = toProductTagPayload(input);

  if (tagId) {
    const { error } = await client.from('product_tags').update(payload).eq('id', tagId);
    if (error) throw error;

    if (previousName && slugifyTag(previousName) !== payload.slug) {
      await renameProductTagInProducts(client, previousName, payload.name);
    }

    return;
  }

  const { error } = await client.from('product_tags').insert(payload);
  if (error) throw error;
}

export async function setProductTagActive(tagId: string, active: boolean) {
  const client = requireSupabase();
  const { error } = await client.from('product_tags').update({ active }).eq('id', tagId);
  if (error) throw error;
}

export async function clearProductTagFromProducts(tagName: string) {
  const client = requireSupabase();

  const { data: productRows, error: productsError } = await client
    .from('products')
    .select('id,tag');

  if (productsError) throw productsError;

  const tagSlug = slugifyTag(tagName);

  for (const productRow of productRows ?? []) {
    const currentTags = normalizeProductTags((productRow as { tag: unknown }).tag);
    const nextTags = currentTags.filter(tag => slugifyTag(tag) !== tagSlug);

    if (nextTags.length === currentTags.length) continue;

    const { error } = await client
      .from('products')
      .update({ tag: nextTags.length > 0 ? nextTags.join(', ') : 'Nenhuma' })
      .eq('id', (productRow as { id: string }).id);

    if (error) throw error;
  }
}

export async function deleteProductTag(tagId: string, tagName: string) {
  const client = requireSupabase();

  await clearProductTagFromProducts(tagName);

  const { error } = await client
    .from('product_tags')
    .delete()
    .eq('id', tagId);

  if (error) throw error;
}

export async function updateProductTagOrder(tagIds: string[]) {
  const client = requireSupabase();

  for (const [index, tagId] of tagIds.entries()) {
    const { error } = await client
      .from('product_tags')
      .update({ sort_order: index })
      .eq('id', tagId);

    if (error) throw error;
  }
}

export async function saveSiteSettings(input: SiteSettingsInput) {
  const client = requireSupabase();
  const payload = toSiteSettingsPayload(input);
  const { error } = await client
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throwLoggedSupabaseError('upsert site settings', 'site_settings', payload, error);
  }
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

export async function uploadSiteImage(file: File) {
  const client = requireSupabase();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `site/${crypto.randomUUID()}.${extension}`;

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
