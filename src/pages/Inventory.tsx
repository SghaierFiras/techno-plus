import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Copy } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { Product, InventoryFilters, ProductFormData } from '../types/inventory';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import ProductForm from '../components/inventory/ProductForm';
import ProductList from '../components/inventory/ProductList';
import ProductFilters from '../components/inventory/ProductFilters';
import ProductDetails from '../components/inventory/ProductDetails';

function CopiableCode({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const short = value.length > 10 ? value.slice(0, 10) + '...' : value;
  return (
    <button
      className="inline-flex items-center gap-1 group text-xs font-mono px-1 py-0.5 rounded hover:bg-black-600 active:bg-black-600 border border-transparent hover:border-black-600 transition cursor-pointer"
      title={copied ? 'Copied!' : 'Copy'}
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      <span>{short}</span>
      <Copy className={`w-3 h-3 ${copied ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
    </button>
  );
}

export default function Inventory() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    categories,
    suppliers,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    filterProducts,
    generateProductCode,
    generateBarcode,
    refreshData
  } = useInventory();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category_id: '',
    subcategory_id: '',
    supplier_id: '',
    low_stock_only: false,
    is_active: true
  });

  const filteredProducts = filterProducts(filters);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    setViewingProduct(null);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  const handleFormSubmit = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        product_code: formData.product_code,
        barcode: formData.barcode,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || undefined,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        quantity_in_stock: formData.quantity_in_stock,
        min_stock_level: formData.min_stock_level,
        supplier_id: formData.supplier_id || undefined,
        image_url: formData.image_url,
        is_active: true
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await createProduct(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } catch (err) {
        console.error('Error deleting product:', err);
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleScanBarcode = async () => {
    // This is now handled by the BarcodeScanButton component in ProductFilters
  };

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon.",
    });
  };

  const handleImport = () => {
    toast({
      title: "Coming Soon",
      description: "Import functionality will be available soon.",
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage your product inventory with barcode scanning support
          </p>
        </div>
        
        <div className="border-destructive">
          <div className="flex items-center space-x-2 p-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="text-sm font-medium">Error Loading Inventory</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('inventory.title')}
        </h1>
        <p className="text-muted-foreground">
          Manage your product inventory with barcode scanning support
        </p>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        categories={categories}
        suppliers={suppliers}
        onFiltersChange={setFilters}
        onScanBarcode={handleScanBarcode}
        onExport={handleExport}
        onImport={handleImport}
        onRefresh={refreshData}
        onAddProduct={handleAddProduct}
        isLoading={loading}
      />

      {/* Product List */}
      <ProductList
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onView={handleViewProduct}
        loading={loading}
      />

      {/* Product Form Dialog */}
      {showForm && (
        <ProductForm
          product={editingProduct || undefined}
          categories={categories}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onGenerateProductCode={generateProductCode}
          onGenerateBarcode={generateBarcode}
          isLoading={isSubmitting}
        />
      )}

      {/* Product Details Dialog */}
      {viewingProduct && (
        <ProductDetails
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
          onEdit={() => handleEditProduct(viewingProduct)}
        />
      )}
    </div>
  );
}