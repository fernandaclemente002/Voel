import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Edit3, ImagePlus, Loader2, LogOut, Package, Plus, RefreshCw, Save, Tags, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  deleteCategory,
  deleteProduct,
  fetchAdminCatalog,
  saveCategory,
  saveProduct,
  updateProductStock,
  uploadProductImage,
} from '../services/catalogService';
import type { Category, CategoryInput, Product, ProductColorImages, ProductInput, ProductTag } from '../types/catalog';
import { productTags } from '../types/catalog';

const emptyCategoryForm: CategoryInput = {
  name: '',
  slug: '',
  isActive: true,
  menuOrder: 0,
};

const emptyProductForm: ProductInput = {
  name: '',
  description: '',
  price: 0,
  stockQuantity: 0,
  categoryId: null,
  tag: 'Nenhuma',
  imageUrl: '',
  imagePath: null,
  maxInstallments: 1,
  availableSizes: [],
  availableColors: [],
  colorImages: {},
  sku: '',
  details: '',
  isActive: true,
};

const commonSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', 'Único'];
const lowStockLimitStorageKey = 'voel:admin-low-stock-limit';
const fieldClass = 'w-full rounded-lg border border-[#D8D0C4] px-3 py-3 text-base outline-none transition-colors focus:border-[#8B7355] sm:text-sm';
const selectClass = `${fieldClass} bg-white`;
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]';

type ColorImageItem = {
  id: string;
  imageUrl: string;
  file: File | null;
  previewUrl: string;
};

type ColorImageRow = {
  id: string;
  color: string;
  images: ColorImageItem[];
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function normalizeComparable(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parsePriceInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseIntegerInput(value: string, min: number) {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= min ? parsed : null;
}

function formatPriceInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function uniqueTextValues(values: string[]) {
  return values.reduce<string[]>((uniqueValues, value) => {
    const trimmed = value.trim();
    if (!trimmed) return uniqueValues;

    const alreadyExists = uniqueValues.some(existing => normalizeComparable(existing) === normalizeComparable(trimmed));
    return alreadyExists ? uniqueValues : [...uniqueValues, trimmed];
  }, []);
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function createColorImageItem(imageUrl = '', file: File | null = null): ColorImageItem {
  return {
    id: createId(),
    imageUrl,
    file,
    previewUrl: file && typeof URL !== 'undefined' ? URL.createObjectURL(file) : imageUrl,
  };
}

function createColorImageRow(color = '', imageUrls: string[] = []): ColorImageRow {
  return {
    id: createId(),
    color,
    images: imageUrls.map(imageUrl => createColorImageItem(imageUrl)),
  };
}

function getColorImageUrls(imageValue: ProductColorImages[string] | undefined) {
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

function findColorImageUrls(colorImages: ProductColorImages, color: string) {
  const normalizedColor = normalizeComparable(color);
  const matchedImageValue = Object.entries(colorImages).find(([imageColor]) => normalizeComparable(imageColor) === normalizedColor)?.[1];
  return getColorImageUrls(matchedImageValue);
}

function productColorRows(product: Product) {
  const colors = uniqueTextValues([
    ...product.availableColors,
    ...Object.keys(product.colorImages),
  ]);

  return colors.map(color => createColorImageRow(color, findColorImageUrls(product.colorImages, color)));
}

function getFirstColorImageUrl(colorImages: ProductColorImages) {
  for (const imageValue of Object.values(colorImages)) {
    const imageUrls = getColorImageUrls(imageValue);
    if (imageUrls.length > 0) return imageUrls[0];
  }

  return '';
}

function revokeColorImageItem(image: ColorImageItem) {
  if (image.file && image.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

function revokeColorImageRows(rows: ColorImageRow[]) {
  rows.forEach(row => row.images.forEach(revokeColorImageItem));
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-[#E5E0D8] pb-6 last:border-b-0 last:pb-0">
      <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-[#3D3835]">{title}</h3>
      {children}
    </section>
  );
}

interface AdminDashboardProps {
  navigate: (path: string) => void;
  session: Session;
}

export default function AdminDashboard({ navigate, session }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryInput>(emptyCategoryForm);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProductForm);
  const [priceText, setPriceText] = useState('');
  const [stockText, setStockText] = useState('0');
  const [installmentsText, setInstallmentsText] = useState('1');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeText, setCustomSizeText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [colorImageRows, setColorImageRows] = useState<ColorImageRow[]>([]);
  const colorImageRowsRef = useRef<ColorImageRow[]>([]);
  const [lowStockLimitText, setLowStockLimitText] = useState(() => {
    try {
      return window.localStorage.getItem(lowStockLimitStorageKey) || '3';
    } catch {
      return '3';
    }
  });

  const loadCatalog = async () => {
    setIsLoading(true);
    setError('');

    try {
      const catalog = await fetchAdminCatalog();
      setCategories(catalog.categories);
      setProducts(catalog.products);
    } catch {
      setError('Não foi possível carregar os dados do Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(lowStockLimitStorageKey, lowStockLimitText);
    } catch {
      // Local preference only; ignoring storage failure keeps the admin usable.
    }
  }, [lowStockLimitText]);

  useEffect(() => {
    colorImageRowsRef.current = colorImageRows;
  }, [colorImageRows]);

  useEffect(() => () => revokeColorImageRows(colorImageRowsRef.current), []);

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setPriceText('');
    setStockText('0');
    setInstallmentsText('1');
    setSelectedSizes([]);
    setCustomSizeText('');
    setImageFile(null);
    revokeColorImageRows(colorImageRowsRef.current);
    setColorImageRows([]);
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm(previous => ({
      ...previous,
      name,
      slug: previous.slug ? previous.slug : slugify(name),
    }));
  };

  const handleToggleSize = (size: string) => {
    setSelectedSizes(previous => {
      const isSelected = previous.some(selectedSize => normalizeComparable(selectedSize) === normalizeComparable(size));
      return isSelected
        ? previous.filter(selectedSize => normalizeComparable(selectedSize) !== normalizeComparable(size))
        : uniqueTextValues([...previous, size]);
    });
  };

  const handleRemoveSize = (size: string) => {
    setSelectedSizes(previous => previous.filter(selectedSize => normalizeComparable(selectedSize) !== normalizeComparable(size)));
  };

  const handleAddCustomSize = () => {
    const customSize = customSizeText.trim();
    if (!customSize) return;

    setSelectedSizes(previous => uniqueTextValues([...previous, customSize]));
    setCustomSizeText('');
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await saveCategory(
        {
          ...categoryForm,
          slug: categoryForm.slug || slugify(categoryForm.name),
        },
        editingCategoryId ?? undefined
      );
      setMessage(editingCategoryId ? 'Categoria atualizada.' : 'Categoria criada.');
      resetCategoryForm();
      await loadCatalog();
    } catch {
      setError('Não foi possível salvar a categoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      if (!productForm.name.trim()) {
        throw new Error('name-required');
      }

      if (!productForm.categoryId) {
        throw new Error('category-required');
      }

      const price = parsePriceInput(priceText);
      const stockQuantity = parseIntegerInput(stockText, 0);
      const maxInstallments = parseIntegerInput(installmentsText, 1);

      if (price === null) {
        throw new Error('price-required');
      }

      if (stockQuantity === null) {
        throw new Error('stock-required');
      }

      if (maxInstallments === null) {
        throw new Error('installments-required');
      }

      let imageUrl = productForm.imageUrl;
      let imagePath = productForm.imagePath;

      if (imageFile) {
        const uploadedImage = await uploadProductImage(imageFile);
        imageUrl = uploadedImage.imageUrl;
        imagePath = uploadedImage.imagePath;
      }

      const colorImages: ProductColorImages = {};
      const availableColors: string[] = [];

      for (const row of colorImageRows) {
        const color = row.color.trim();
        const rowHasImage = row.images.length > 0;

        if (!color && rowHasImage) {
          throw new Error('color-name-required');
        }

        if (!color) continue;

        const existingColor = availableColors.find(currentColor => normalizeComparable(currentColor) === normalizeComparable(color));
        const colorKey = existingColor ?? color;

        if (!existingColor) {
          availableColors.push(color);
        }

        const rowImageUrls: string[] = [];

        for (const image of row.images) {
          let colorImageUrl = image.imageUrl.trim();

          if (image.file) {
            const uploadedImage = await uploadProductImage(image.file);
            colorImageUrl = uploadedImage.imageUrl;
          }

          if (colorImageUrl && !rowImageUrls.includes(colorImageUrl)) {
            rowImageUrls.push(colorImageUrl);
          }
        }

        if (rowImageUrls.length > 0) {
          const mergedImageUrls = [...getColorImageUrls(colorImages[colorKey])];

          rowImageUrls.forEach(colorImageUrl => {
            if (!mergedImageUrls.includes(colorImageUrl)) {
              mergedImageUrls.push(colorImageUrl);
            }
          });

          colorImages[colorKey] = mergedImageUrls.length === 1 ? mergedImageUrls[0] : mergedImageUrls;
        }
      }

      if (!imageUrl) {
        imageUrl = getFirstColorImageUrl(colorImages);
      }

      if (!imageUrl) {
        throw new Error('image-required');
      }

      await saveProduct(
        {
          ...productForm,
          imageUrl,
          imagePath,
          price,
          stockQuantity,
          maxInstallments,
          availableSizes: uniqueTextValues(selectedSizes),
          availableColors,
          colorImages,
          sku: productForm.sku?.trim() || null,
          details: productForm.details?.trim() || null,
        },
        editingProductId ?? undefined
      );
      setMessage(editingProductId ? 'Produto atualizado.' : 'Produto criado.');
      resetProductForm();
      await loadCatalog();
    } catch (saveError) {
      const typedError = saveError as Error;
      if (typedError.message === 'name-required') {
        setError('Informe o nome do produto.');
      } else if (typedError.message === 'category-required') {
        setError('Selecione uma categoria para o produto.');
      } else if (typedError.message === 'price-required') {
        setError('Informe um preço válido maior que zero.');
      } else if (typedError.message === 'stock-required') {
        setError('Informe um estoque válido, com número inteiro maior ou igual a zero.');
      } else if (typedError.message === 'installments-required') {
        setError('Informe uma quantidade de parcelas válida, com número inteiro maior ou igual a 1.');
      } else if (typedError.message === 'image-required') {
        setError('Envie uma imagem principal ou uma imagem em alguma variação de cor.');
      } else if (typedError.message === 'color-name-required') {
        setError('Informe o nome da cor nas variações que têm imagem.');
      } else {
        setError('Não foi possível salvar o produto.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setActiveTab('categories');
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      menuOrder: category.menuOrder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProduct = (product: Product) => {
    setActiveTab('products');
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      tag: product.tag,
      imageUrl: product.imageUrl,
      imagePath: product.imagePath,
      maxInstallments: product.maxInstallments,
      availableSizes: product.availableSizes,
      availableColors: product.availableColors,
      colorImages: product.colorImages,
      sku: product.sku ?? '',
      details: product.details ?? '',
      isActive: product.isActive,
    });
    setPriceText(formatPriceInput(product.price));
    setStockText(String(product.stockQuantity ?? 0));
    setInstallmentsText(String(Math.max(1, Number(product.maxInstallments) || 1)));
    setSelectedSizes(uniqueTextValues(product.availableSizes));
    setCustomSizeText('');
    setImageFile(null);
    revokeColorImageRows(colorImageRowsRef.current);
    setColorImageRows(productColorRows(product));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddColorImageRow = () => {
    setColorImageRows(previous => [...previous, createColorImageRow()]);
  };

  const handleUpdateColorImageRow = (rowId: string, changes: Partial<Pick<ColorImageRow, 'color'>>) => {
    setColorImageRows(previous => previous.map(row => row.id === rowId ? { ...row, ...changes } : row));
  };

  const handleAddColorImages = (rowId: string, files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    const nextImages = selectedFiles.map(file => createColorImageItem('', file));
    setColorImageRows(previous => previous.map(row => (
      row.id === rowId
        ? { ...row, images: [...row.images, ...nextImages] }
        : row
    )));
  };

  const handleRemoveColorImage = (rowId: string, imageId: string) => {
    const imageToRemove = colorImageRows
      .find(row => row.id === rowId)
      ?.images.find(image => image.id === imageId);

    if (imageToRemove) {
      revokeColorImageItem(imageToRemove);
    }

    setColorImageRows(previous => previous.map(row => (
      row.id === rowId
        ? { ...row, images: row.images.filter(image => image.id !== imageId) }
        : row
    )));
  };

  const handleRemoveColorImageRow = (rowId: string) => {
    const rowToRemove = colorImageRows.find(row => row.id === rowId);
    if (rowToRemove) {
      revokeColorImageRows([rowToRemove]);
    }

    setColorImageRows(previous => previous.filter(row => row.id !== rowId));
  };

  const handleApplyStockChange = async (product: Product, delta: number, requiresConfirmation: boolean) => {
    if (requiresConfirmation && !window.confirm('Confirmar baixa de estoque?')) return;

    const nextStockQuantity = product.stockQuantity + delta;
    if (nextStockQuantity < 0) {
      setMessage('');
      setError('Estoque insuficiente para essa baixa.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProductStock(product.id, nextStockQuantity);
      setProducts(previous => previous.map(currentProduct => (
        currentProduct.id === product.id
          ? { ...currentProduct, stockQuantity: nextStockQuantity }
          : currentProduct
      )));

      if (editingProductId === product.id) {
        setStockText(String(nextStockQuantity));
        setProductForm(previous => ({ ...previous, stockQuantity: nextStockQuantity }));
      }

      setMessage('Estoque atualizado.');
    } catch {
      setError('Não foi possível atualizar o estoque.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterSale = (product: Product) => {
    handleApplyStockChange(product, -1, true);
  };

  const handleDecreaseStock = (product: Product) => {
    const quantityText = window.prompt('Quantidade para baixar do estoque:', '1');
    if (quantityText === null) return;

    const quantity = parseIntegerInput(quantityText, 1);
    if (quantity === null) {
      setMessage('');
      setError('Informe uma quantidade válida para baixar.');
      return;
    }

    handleApplyStockChange(product, -quantity, true);
  };

  const handleIncreaseStock = (product: Product) => {
    const quantityText = window.prompt('Quantidade para adicionar ao estoque:', '1');
    if (quantityText === null) return;

    const quantity = parseIntegerInput(quantityText, 1);
    if (quantity === null) {
      setMessage('');
      setError('Informe uma quantidade válida para adicionar.');
      return;
    }

    handleApplyStockChange(product, quantity, false);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return;

    setMessage('');
    setError('');

    try {
      await deleteCategory(category.id);
      setMessage('Categoria excluída.');
      await loadCatalog();
    } catch {
      setError('Não foi possível excluir a categoria. Verifique se há produtos vinculados.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;

    setMessage('');
    setError('');

    try {
      await deleteProduct(product.id);
      setMessage('Produto excluído.');
      await loadCatalog();
    } catch {
      setError('Não foi possível excluir o produto.');
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    navigate('/admin/login');
  };

  const imagePreview = imageFile ? URL.createObjectURL(imageFile) : productForm.imageUrl;
  const lowStockLimit = parseIntegerInput(lowStockLimitText, 0) ?? 0;
  const lowStockProducts = products
    .filter(product => product.stockQuantity <= lowStockLimit)
    .sort((firstProduct, secondProduct) => firstProduct.stockQuantity - secondProduct.stockQuantity);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#2F2A27]">
      <header className="border-b border-[#E5E0D8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8B7355]">Admin</p>
            <h1 className="font-serif text-2xl uppercase tracking-[0.25em]">VÖEL</h1>
            <p className="mt-1 text-xs text-[#7A7067]">{session.user.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg border border-[#D8D0C4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
              type="button"
            >
              Ver site
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg bg-[#3D3835] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8B7355]"
              type="button"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${activeTab === 'products' ? 'bg-[#3D3835] text-white' : 'border border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'}`}
              type="button"
            >
              <Package size={15} /> Produtos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${activeTab === 'categories' ? 'bg-[#3D3835] text-white' : 'border border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'}`}
              type="button"
            >
              <Tags size={15} /> Categorias
            </button>
          </div>

          <button
            onClick={loadCatalog}
            className="flex w-fit items-center gap-2 rounded-lg border border-[#D8D0C4] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
            type="button"
          >
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#E5E0D8] bg-white">
            <Loader2 className="animate-spin text-[#8B7355]" size={28} />
          </div>
        ) : activeTab === 'products' ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
            <form onSubmit={handleProductSubmit} className="h-fit rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl uppercase tracking-[0.2em]">{editingProductId ? 'Editar produto' : 'Novo produto'}</h2>
                  <p className="mt-1 text-xs text-[#7A7067]">Produtos ativos aparecem na vitrine pública.</p>
                </div>
                <button onClick={resetProductForm} className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B7355]" type="button">
                  Limpar
                </button>
              </div>

              <div className="space-y-6">
                <FormBlock title="Informações principais">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Nome</span>
                    <input
                      value={productForm.name}
                      onChange={(event) => setProductForm(previous => ({ ...previous, name: event.target.value }))}
                      className={fieldClass}
                      placeholder="Nome do produto"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className={labelClass}>SKU</span>
                      <input
                        value={productForm.sku ?? ''}
                        onChange={(event) => setProductForm(previous => ({ ...previous, sku: event.target.value }))}
                        className={fieldClass}
                        placeholder="Opcional"
                      />
                    </label>

                    <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[#D8D0C4] px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={productForm.isActive}
                        onChange={(event) => setProductForm(previous => ({ ...previous, isActive: event.target.checked }))}
                        className="h-5 w-5 accent-[#8B7355]"
                      />
                      Produto ativo
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className={labelClass}>Imagem principal</span>
                    <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9BFAF] bg-[#FDFCF7] px-3 py-4 text-sm text-[#7A7067] transition-colors hover:border-[#8B7355]">
                      <Upload size={16} /> {imageFile ? imageFile.name : imagePreview ? 'Trocar imagem principal' : 'Enviar imagem principal'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                      />
                    </span>
                  </label>

                  {imagePreview && (
                    <div className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FDFCF7]">
                      <img src={imagePreview} alt="Prévia do produto" className="h-48 w-full object-cover" />
                    </div>
                  )}
                </FormBlock>

                <FormBlock title="Preço e estoque">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Preço</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={priceText}
                        onChange={(event) => setPriceText(event.target.value)}
                        className={fieldClass}
                        placeholder="399,99"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span className={labelClass}>Estoque</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={stockText}
                        onChange={(event) => setStockText(event.target.value)}
                        className={fieldClass}
                        placeholder="0"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span className={labelClass}>Parcelas</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={installmentsText}
                        onChange={(event) => setInstallmentsText(event.target.value)}
                        className={fieldClass}
                        placeholder="1"
                      />
                    </label>
                  </div>
                </FormBlock>

                <FormBlock title="Categoria e tag">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Categoria</span>
                      <select
                        value={productForm.categoryId ?? ''}
                        onChange={(event) => setProductForm(previous => ({ ...previous, categoryId: event.target.value || null }))}
                        className={selectClass}
                      >
                        <option value="">Selecione</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}{category.isActive ? '' : ' (inativa)'}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1.5">
                      <span className={labelClass}>Tag</span>
                      <select
                        value={productForm.tag}
                        onChange={(event) => setProductForm(previous => ({ ...previous, tag: event.target.value as ProductTag }))}
                        className={selectClass}
                      >
                        {productTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </FormBlock>

                <FormBlock title="Tamanhos disponíveis">
                  <div className="flex flex-wrap gap-2">
                    {commonSizes.map(size => {
                      const isSelected = selectedSizes.some(selectedSize => normalizeComparable(selectedSize) === normalizeComparable(size));
                      return (
                        <button
                          key={size}
                          onClick={() => handleToggleSize(size)}
                          className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'border-[#8B7355] bg-[#8B7355] text-white'
                              : 'border-[#D8D0C4] bg-white text-[#3D3835] hover:border-[#8B7355]'
                          }`}
                          type="button"
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSizes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => handleRemoveSize(size)}
                          className="flex min-h-9 items-center gap-1 rounded-full bg-[#F5F1EC] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#3D3835] transition-colors hover:bg-[#E5E0D8]"
                          type="button"
                        >
                          {size} <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={customSizeText}
                      onChange={(event) => setCustomSizeText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddCustomSize();
                        }
                      }}
                      className={fieldClass}
                      placeholder="Tamanho personalizado"
                    />
                    <button
                      onClick={handleAddCustomSize}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#D8D0C4] bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
                      type="button"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                </FormBlock>

                <FormBlock title="Variações de cor">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-relaxed text-[#7A7067]">
                      As cores da vitrine serão criadas a partir destas variações.
                    </p>
                    <button
                      onClick={handleAddColorImageRow}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#D8D0C4] bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
                      type="button"
                    >
                      <Plus size={14} /> Adicionar cor
                    </button>
                  </div>

                  {colorImageRows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#D8D0C4] px-3 py-4 text-center text-xs text-[#9B8F7E]">
                      Nenhuma variação de cor cadastrada.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {colorImageRows.map(row => (
                        <div key={row.id} className="space-y-3 border-t border-[#E5E0D8] pt-4 first:border-t-0 first:pt-0">
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <label className="block space-y-1.5">
                              <span className={labelClass}>Nome da cor</span>
                              <input
                                value={row.color}
                                onChange={(event) => handleUpdateColorImageRow(row.id, { color: event.target.value })}
                                className={fieldClass}
                                placeholder="Vermelho"
                              />
                            </label>

                            <button
                              onClick={() => handleRemoveColorImageRow(row.id)}
                              className="flex min-h-12 items-center justify-center gap-2 self-end rounded-lg border border-red-200 px-4 text-xs font-bold uppercase tracking-[0.16em] text-red-700 transition-colors hover:bg-red-50"
                              type="button"
                            >
                              <Trash2 size={14} /> Remover
                            </button>
                          </div>

                          <div className="space-y-3">
                            <label className="block space-y-1.5">
                              <span className={labelClass}>Imagens da cor</span>
                              <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9BFAF] bg-[#FDFCF7] px-3 py-3 text-sm text-[#7A7067] transition-colors hover:border-[#8B7355]">
                                <Upload size={15} /> {row.images.length > 0 ? 'Adicionar mais imagens' : 'Adicionar imagens'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(event) => {
                                    handleAddColorImages(row.id, event.target.files);
                                    event.currentTarget.value = '';
                                  }}
                                />
                              </span>
                            </label>

                            {row.images.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {row.images.map((image, imageIndex) => (
                                  <div key={image.id} className="group relative overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FDFCF7]">
                                    <img
                                      src={image.previewUrl}
                                      alt={`${row.color || 'Cor'} ${imageIndex + 1}`}
                                      className="aspect-square w-full object-cover"
                                    />
                                    <button
                                      onClick={() => handleRemoveColorImage(row.id, image.id)}
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#3D3835] shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-700"
                                      type="button"
                                      aria-label="Remover imagem"
                                    >
                                      <X size={14} />
                                    </button>
                                    {image.file && (
                                      <div className="absolute inset-x-0 bottom-0 bg-[#1F1B18]/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                        Nova
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-lg border border-dashed border-[#D8D0C4] px-3 py-3 text-xs text-[#9B8F7E]">
                                Sem imagem própria, usa a imagem principal.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </FormBlock>

                <FormBlock title="Descrição e detalhes">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Descrição</span>
                    <textarea
                      value={productForm.description}
                      onChange={(event) => setProductForm(previous => ({ ...previous, description: event.target.value }))}
                      className={`${fieldClass} min-h-28 resize-y`}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className={labelClass}>Descrição detalhada</span>
                    <textarea
                      value={productForm.details ?? ''}
                      onChange={(event) => setProductForm(previous => ({ ...previous, details: event.target.value }))}
                      className={`${fieldClass} min-h-28 resize-y`}
                      placeholder="Opcional"
                    />
                  </label>
                </FormBlock>

                <button
                  type="submit"
                  disabled={isSaving || categories.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3D3835] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8B7355] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar produto
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#E5E0D8] p-5">
                <div>
                  <h2 className="font-serif text-xl uppercase tracking-[0.2em]">Produtos</h2>
                  <p className="mt-1 text-xs text-[#7A7067]">{products.length} produtos cadastrados</p>
                </div>
                <Package className="text-[#8B7355]" size={22} />
              </div>

              <div className="border-b border-[#E5E0D8] bg-[#FDFCF7] p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-serif text-sm uppercase tracking-[0.2em] text-[#3D3835]">Estoque baixo</h3>
                    <p className="mt-1 text-xs text-[#7A7067]">Produtos com estoque no limite configurado.</p>
                  </div>

                  <label className="block w-full max-w-44 space-y-1.5">
                    <span className={labelClass}>Limite</span>
                    <input
                      value={lowStockLimitText}
                      onChange={(event) => setLowStockLimitText(event.target.value)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={fieldClass}
                      placeholder="3"
                    />
                  </label>
                </div>

                {lowStockProducts.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#D8D0C4] bg-white px-3 py-4 text-center text-xs text-[#9B8F7E]">
                    Nenhum produto no limite de estoque.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {lowStockProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleEditProduct(product)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E0D8] bg-white px-3 py-3 text-left transition-colors hover:border-[#8B7355]"
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#3D3835]">{product.name}</span>
                          <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-[#9B8F7E]">{product.category}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${product.stockQuantity === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {product.stockQuantity === 0 ? 'Esgotado' : `${product.stockQuantity} un.`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="divide-y divide-[#E5E0D8]">
                {products.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center text-[#7A7067]">
                    <ImagePlus size={28} />
                    <p className="text-sm">Nenhum produto cadastrado.</p>
                  </div>
                ) : (
                  products.map(product => (
                    <article key={product.id} className="grid gap-4 p-4 md:grid-cols-[88px_1fr_auto]">
                      <div className="h-28 w-24 overflow-hidden rounded-lg bg-[#F5F1EC] md:h-24">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#9B8F7E]">
                            <ImagePlus size={20} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#2F2A27]">{product.name}</h3>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                            {product.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          {product.tag !== 'Nenhuma' && (
                            <span className="rounded-full bg-[#F5F1EC] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8B7355]">{product.tag}</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm text-[#7A7067]">{product.description}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#9B8F7E]">
                          {product.category} · {formatPrice(product.price)} · até {product.maxInstallments}x · estoque {product.stockQuantity}
                        </p>
                        <div className="grid gap-2 pt-2 sm:grid-cols-3">
                          <button
                            onClick={() => handleRegisterSale(product)}
                            disabled={isSaving}
                            className="min-h-10 rounded-lg border border-[#D8D0C4] bg-white px-3 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-[#3D3835] transition-colors hover:border-[#8B7355] disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                          >
                            Registrar venda
                          </button>
                          <button
                            onClick={() => handleDecreaseStock(product)}
                            disabled={isSaving}
                            className="min-h-10 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-amber-800 transition-colors hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                          >
                            Baixar estoque por quantidade
                          </button>
                          <button
                            onClick={() => handleIncreaseStock(product)}
                            disabled={isSaving}
                            className="min-h-10 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-emerald-800 transition-colors hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                          >
                            Adicionar estoque por quantidade
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 md:justify-end">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="flex items-center gap-2 rounded-lg border border-[#D8D0C4] px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
                          type="button"
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700 transition-colors hover:bg-red-50"
                          type="button"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
            <form onSubmit={handleCategorySubmit} className="h-fit rounded-lg border border-[#E5E0D8] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl uppercase tracking-[0.2em]">{editingCategoryId ? 'Editar categoria' : 'Nova categoria'}</h2>
                  <p className="mt-1 text-xs text-[#7A7067]">A ordem define a posição no menu.</p>
                </div>
                <button onClick={resetCategoryForm} className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B7355]" type="button">
                  Limpar
                </button>
              </div>

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Nome</span>
                  <input
                    value={categoryForm.name}
                    onChange={(event) => handleCategoryNameChange(event.target.value)}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Slug</span>
                  <input
                    value={categoryForm.slug}
                    onChange={(event) => setCategoryForm(previous => ({ ...previous, slug: slugify(event.target.value) }))}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Ordem no menu</span>
                  <input
                    type="number"
                    step="1"
                    value={categoryForm.menuOrder}
                    onChange={(event) => setCategoryForm(previous => ({ ...previous, menuOrder: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    required
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(event) => setCategoryForm(previous => ({ ...previous, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-[#8B7355]"
                  />
                  Categoria ativa
                </label>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3D3835] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8B7355] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingCategoryId ? <Save size={16} /> : <Plus size={16} />}
                  Salvar categoria
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-[#E5E0D8] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#E5E0D8] p-5">
                <div>
                  <h2 className="font-serif text-xl uppercase tracking-[0.2em]">Categorias</h2>
                  <p className="mt-1 text-xs text-[#7A7067]">{categories.length} categorias cadastradas</p>
                </div>
                <Tags className="text-[#8B7355]" size={22} />
              </div>

              <div className="divide-y divide-[#E5E0D8]">
                {categories.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center text-[#7A7067]">
                    <Tags size={28} />
                    <p className="text-sm">Nenhuma categoria cadastrada.</p>
                  </div>
                ) : (
                  categories.map(category => {
                    const productCount = products.filter(product => product.categoryId === category.id).length;
                    return (
                      <article key={category.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-[#2F2A27]">{category.name}</h3>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${category.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {category.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#9B8F7E]">/{category.slug} · ordem {category.menuOrder} · {productCount} produtos</p>
                        </div>

                        <div className="flex items-start gap-2 md:justify-end">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="flex items-center gap-2 rounded-lg border border-[#D8D0C4] px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
                            type="button"
                          >
                            <Edit3 size={14} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700 transition-colors hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
