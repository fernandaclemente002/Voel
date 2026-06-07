import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Edit3, ImagePlus, Loader2, LogOut, Package, Plus, RefreshCw, Save, Tags, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  deleteCategory,
  deleteProduct,
  fetchAdminCatalog,
  saveCategory,
  saveProduct,
  uploadProductImage,
} from '../services/catalogService';
import type { Category, CategoryInput, Product, ProductInput, ProductTag } from '../types/catalog';
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

type ColorImageRow = {
  id: string;
  color: string;
  imageUrl: string;
  file: File | null;
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

function splitCommaList(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function joinCommaList(values: string[]) {
  return values.join(', ');
}

function createColorImageRow(color = '', imageUrl = ''): ColorImageRow {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

  return {
    id,
    color,
    imageUrl,
    file: null,
  };
}

function colorImagesToRows(colorImages: Record<string, string> = {}) {
  return Object.entries(colorImages).map(([color, imageUrl]) => createColorImageRow(color, imageUrl));
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
  const [sizesText, setSizesText] = useState('');
  const [colorsText, setColorsText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [colorImageRows, setColorImageRows] = useState<ColorImageRow[]>([]);

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

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setSizesText('');
    setColorsText('');
    setImageFile(null);
    setColorImageRows([]);
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm(previous => ({
      ...previous,
      name,
      slug: previous.slug ? previous.slug : slugify(name),
    }));
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
      if (!productForm.categoryId) {
        throw new Error('category-required');
      }

      let imageUrl = productForm.imageUrl;
      let imagePath = productForm.imagePath;

      if (imageFile) {
        const uploadedImage = await uploadProductImage(imageFile);
        imageUrl = uploadedImage.imageUrl;
        imagePath = uploadedImage.imagePath;
      }

      if (!imageUrl) {
        throw new Error('image-required');
      }

      const colorImages: Record<string, string> = {};

      for (const row of colorImageRows) {
        const color = row.color.trim();
        if (!color) continue;

        let colorImageUrl = row.imageUrl.trim();

        if (row.file) {
          const uploadedImage = await uploadProductImage(row.file);
          colorImageUrl = uploadedImage.imageUrl;
        }

        if (colorImageUrl) {
          colorImages[color] = colorImageUrl;
        }
      }

      await saveProduct(
        {
          ...productForm,
          imageUrl,
          imagePath,
          maxInstallments: Math.max(1, Number(productForm.maxInstallments) || 1),
          availableSizes: splitCommaList(sizesText),
          availableColors: splitCommaList(colorsText),
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
      if (typedError.message === 'category-required') {
        setError('Selecione uma categoria para o produto.');
      } else if (typedError.message === 'image-required') {
        setError('Envie uma imagem para o produto.');
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
    setSizesText(joinCommaList(product.availableSizes));
    setColorsText(joinCommaList(product.availableColors));
    setImageFile(null);
    setColorImageRows(colorImagesToRows(product.colorImages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddColorImageRow = () => {
    setColorImageRows(previous => [...previous, createColorImageRow()]);
  };

  const handleUpdateColorImageRow = (rowId: string, changes: Partial<ColorImageRow>) => {
    setColorImageRows(previous => previous.map(row => row.id === rowId ? { ...row, ...changes } : row));
  };

  const handleRemoveColorImageRow = (rowId: string) => {
    setColorImageRows(previous => previous.filter(row => row.id !== rowId));
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

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Nome</span>
                  <input
                    value={productForm.name}
                    onChange={(event) => setProductForm(previous => ({ ...previous, name: event.target.value }))}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Descrição</span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) => setProductForm(previous => ({ ...previous, description: event.target.value }))}
                    className="min-h-24 w-full resize-y rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Preço</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(event) => setProductForm(previous => ({ ...previous, price: Number(event.target.value) }))}
                      className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                      required
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Parcelas</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={productForm.maxInstallments}
                      onChange={(event) => setProductForm(previous => ({ ...previous, maxInstallments: Math.max(1, Number(event.target.value) || 1) }))}
                      className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                      required
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Estoque</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.stockQuantity}
                      onChange={(event) => setProductForm(previous => ({ ...previous, stockQuantity: Number(event.target.value) }))}
                      className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                      required
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">SKU</span>
                    <input
                      value={productForm.sku ?? ''}
                      onChange={(event) => setProductForm(previous => ({ ...previous, sku: event.target.value }))}
                      className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Categoria</span>
                    <select
                      value={productForm.categoryId ?? ''}
                      onChange={(event) => setProductForm(previous => ({ ...previous, categoryId: event.target.value || null }))}
                      className="w-full rounded-lg border border-[#D8D0C4] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                      required
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
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Tag</span>
                    <select
                      value={productForm.tag}
                      onChange={(event) => setProductForm(previous => ({ ...previous, tag: event.target.value as ProductTag }))}
                      className="w-full rounded-lg border border-[#D8D0C4] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    >
                      {productTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(event) => setProductForm(previous => ({ ...previous, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-[#8B7355]"
                  />
                  Produto ativo
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Tamanhos disponíveis</span>
                  <input
                    value={sizesText}
                    onChange={(event) => setSizesText(event.target.value)}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    placeholder="P, M, G, GG"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Cores disponíveis</span>
                  <input
                    value={colorsText}
                    onChange={(event) => setColorsText(event.target.value)}
                    className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    placeholder="Preto, Bege, Vermelho"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Descrição detalhada</span>
                  <textarea
                    value={productForm.details ?? ''}
                    onChange={(event) => setProductForm(previous => ({ ...previous, details: event.target.value }))}
                    className="min-h-24 w-full resize-y rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                    placeholder="Opcional"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Imagem</span>
                  <span className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9BFAF] bg-[#FDFCF7] px-3 py-4 text-sm text-[#7A7067] transition-colors hover:border-[#8B7355]">
                    <Upload size={16} /> {imageFile ? imageFile.name : 'Enviar imagem'}
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

                <div className="space-y-3 rounded-lg border border-[#E5E0D8] bg-[#FDFCF7] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Imagens por cor</p>
                      <p className="mt-1 text-xs text-[#9B8F7E]">Opcional. Use os mesmos nomes das cores disponíveis.</p>
                    </div>
                    <button
                      onClick={handleAddColorImageRow}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-[#D8D0C4] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3D3835] transition-colors hover:border-[#8B7355]"
                      type="button"
                    >
                      <Plus size={13} /> Adicionar
                    </button>
                  </div>

                  {colorImageRows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#D8D0C4] px-3 py-4 text-center text-xs text-[#9B8F7E]">
                      Nenhuma imagem específica por cor.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {colorImageRows.map(row => (
                        <div key={row.id} className="space-y-3 rounded-lg border border-[#E5E0D8] bg-white p-3">
                          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                            <label className="block space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Cor</span>
                              <input
                                value={row.color}
                                onChange={(event) => handleUpdateColorImageRow(row.id, { color: event.target.value })}
                                className="w-full rounded-lg border border-[#D8D0C4] px-3 py-2 text-sm outline-none focus:border-[#8B7355]"
                                placeholder="Vermelho"
                              />
                            </label>

                            <button
                              onClick={() => handleRemoveColorImageRow(row.id)}
                              className="flex h-10 items-center justify-center gap-1 self-end rounded-lg border border-red-200 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 transition-colors hover:bg-red-50"
                              type="button"
                            >
                              <Trash2 size={13} /> Remover
                            </button>
                          </div>

                          <label className="block space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A7067]">Imagem da cor</span>
                            <span className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9BFAF] bg-[#FDFCF7] px-3 py-3 text-sm text-[#7A7067] transition-colors hover:border-[#8B7355]">
                              <Upload size={15} /> {row.file ? row.file.name : row.imageUrl ? 'Trocar imagem' : 'Enviar imagem'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => handleUpdateColorImageRow(row.id, { file: event.target.files?.[0] ?? null })}
                              />
                            </span>
                          </label>

                          {row.imageUrl && !row.file && (
                            <div className="overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FDFCF7]">
                              <img src={row.imageUrl} alt={`Imagem da cor ${row.color || 'selecionada'}`} className="h-32 w-full object-cover" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
