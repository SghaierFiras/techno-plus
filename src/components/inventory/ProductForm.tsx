import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Upload, Copy, RefreshCw } from 'lucide-react';
import { Product, Category, Supplier, ProductFormData, ProductVariantFormData } from '../../types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BarcodeScanButton from '../barcode/BarcodeScanButton';
import CameraScannerModal from '../CameraScannerModal';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  suppliers: Supplier[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  onGenerateProductCode: () => Promise<string>;
  onGenerateBarcode: () => Promise<string>;
  isLoading?: boolean;
}

export default function ProductForm({ 
  product, 
  categories, 
  suppliers, 
  onSubmit, 
  onCancel, 
  onGenerateProductCode,
  onGenerateBarcode,
  isLoading 
}: ProductFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    product_code: '',
    barcode: '',
    category_id: '',
    subcategory_id: '',
    cost_price: 0,
    selling_price: 0,
    quantity_in_stock: 0,
    min_stock_level: 5,
    supplier_id: '',
    image_url: '',
    variants: []
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        product_code: product.product_code,
        barcode: product.barcode || '',
        category_id: product.category_id,
        subcategory_id: product.subcategory_id || '',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        quantity_in_stock: product.quantity_in_stock,
        min_stock_level: product.min_stock_level,
        supplier_id: product.supplier_id || '',
        image_url: product.image_url || '',
        variants: product.variants?.map(v => ({
          name: v.name,
          value: v.value,
          additional_cost: v.additional_cost,
          quantity_in_stock: v.quantity_in_stock,
          barcode: v.barcode || ''
        })) || []
      });
      setImagePreview(product.image_url || '');
      
      const category = categories.find(c => c.id === product.category_id);
      setSelectedCategory(category || null);
    } else {
      // Auto-generate codes for new products
      handleGenerateProductCode();
      handleGenerateBarcode();
    }
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value as never }));
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'none') {
      setSelectedCategory(null);
      setFormData(prev => ({ 
        ...prev, 
        category_id: '',
        subcategory_id: ''
      }));
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    setFormData(prev => ({ 
      ...prev, 
      category_id: categoryId,
      subcategory_id: '' // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    if (subcategoryId === 'none') {
      handleInputChange('subcategory_id', '');
    } else {
      handleInputChange('subcategory_id', subcategoryId);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === 'none') {
      handleInputChange('supplier_id', '');
    } else {
      handleInputChange('supplier_id', supplierId);
    }
  };

  const handleGenerateProductCode = async () => {
    try {
      setIsGeneratingCode(true);
      const code = await onGenerateProductCode();
      handleInputChange('product_code', code);
    } catch (error) {
      console.error('Failed to generate product code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      setIsGeneratingBarcode(true);
      const barcode = await onGenerateBarcode();
      handleInputChange('barcode', barcode);
    } catch (error) {
      console.error('Failed to generate barcode:', error);
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${field} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariantFormData = {
      name: '',
      value: '',
      additional_cost: 0,
      quantity_in_stock: 0,
      barcode: ''
    };
    handleInputChange('variants', [...formData.variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof ProductVariantFormData, value: unknown) => {
    const updatedVariants = formData.variants.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    );
    handleInputChange('variants', updatedVariants);
  };

  const removeVariant = (index: number) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    handleInputChange('variants', updatedVariants);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        handleInputChange('image_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? t('inventory.editProduct') : t('inventory.addProduct')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.basicInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('inventory.productName')} *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Product name"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('inventory.description')}</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Product description"
                  />
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <Label htmlFor="product_code">{t('inventory.productCode')} *</Label>
                  <div className="flex">
                    <Input
                      id="product_code"
                      required
                      value={formData.product_code}
                      onChange={(e) => handleInputChange('product_code', e.target.value)}
                      className="rounded-r-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(formData.product_code, 'Product Code')}
                      className="rounded-none border-l-0"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateProductCode}
                      disabled={isGeneratingCode}
                      className="rounded-l-none border-l-0"
                      title={t('inventory.generateCode')}
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('inventory.barcode')}</Label>
                  <div className="flex">
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="rounded-r-none"
                    />
                    <BarcodeScanButton
                      onScan={() => setShowCameraScanner(true)}
                      variant="outline"
                      size="default"
                      className="rounded-none border-l-0"
                      title="Scan Product Barcode"
                      description="Scan the barcode on your product"
                    />
                    <CameraScannerModal
                      open={showCameraScanner}
                      onClose={() => setShowCameraScanner(false)}
                      onScanSuccess={(barcode) => {
                        setShowCameraScanner(false);
                        handleInputChange('barcode', barcode);
                      }}
                      title="Scan Product Barcode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(formData.barcode, 'Barcode')}
                      className="rounded-none border-l-0"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateBarcode}
                      disabled={isGeneratingBarcode}
                      className="rounded-l-none border-l-0"
                      title={t('inventory.generateBarcode')}
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingBarcode ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories and Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.categoriesAndPricing')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label>{t('inventory.category')} *</Label>
                  <Select
                    required
                    value={formData.category_id || 'none'}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('inventory.selectCategory', 'Select a category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a category</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory */}
                {selectedCategory?.children && selectedCategory.children.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('inventory.subcategory')}</Label>
                    <Select
                      value={formData.subcategory_id || 'none'}
                      onValueChange={handleSubcategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('inventory.selectSubcategory', 'Select a subcategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a subcategory</SelectItem>
                        {selectedCategory.children.map(subcategory => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Supplier */}
                <div className="space-y-2">
                  <Label>{t('inventory.supplier')}</Label>
                  <Select
                    value={formData.supplier_id || 'none'}
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a supplier</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">{t('inventory.cost')} *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">{t('inventory.price')} *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.selling_price}
                      onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t('inventory.quantity')} *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      required
                      value={formData.quantity_in_stock}
                      onChange={(e) => handleInputChange('quantity_in_stock', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">{t('inventory.minStock')} *</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      min="0"
                      required
                      value={formData.min_stock_level}
                      onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.productImage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium hover:bg-accent">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('inventory.uploadImage')}
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Variants */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('inventory.productVariants')}</CardTitle>
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.addVariant')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.variants.map((variant, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium">
                        {t('inventory.variant')} {index + 1}
                      </h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>{t('common.name')}</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="e.g., Color, Size"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('common.value', 'Value')}</Label>
                        <Input
                          value={variant.value}
                          onChange={(e) => updateVariant(index, 'value', e.target.value)}
                          placeholder="e.g., Red, Large"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('inventory.additionalCost')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.additional_cost}
                          onChange={(e) => updateVariant(index, 'additional_cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('common.quantity')}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.quantity_in_stock}
                          onChange={(e) => updateVariant(index, 'quantity_in_stock', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Barcode</Label>
                        <div className="flex">
                          <Input
                            value={variant.barcode}
                            onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                            className="rounded-r-none"
                            placeholder="Variant barcode"
                          />
                          <BarcodeScanButton
                            onScan={(barcode) => updateVariant(index, 'barcode', barcode)}
                            variant="outline"
                            size="icon"
                            className="rounded-l-none border-l-0"
                            title="Scan Variant Barcode"
                            description="Scan the barcode for this product variant"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}