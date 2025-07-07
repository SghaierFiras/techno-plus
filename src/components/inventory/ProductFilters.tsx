import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, Upload, RefreshCw, Plus } from 'lucide-react';
import { Category, Supplier, InventoryFilters, Product } from '../../types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BarcodeScanButton from '../barcode/BarcodeScanButton';
import { useInventory } from '../../hooks/useInventory';
import { useDebounce } from '../../hooks/useDebounce';
import { Loader2 } from 'lucide-react';

interface ProductFiltersProps {
  filters: InventoryFilters;
  categories: Category[];
  suppliers: Supplier[];
  onFiltersChange: (filters: InventoryFilters) => void;
  onExport: () => void;
  onImport: () => void;
  onRefresh: () => void;
  onAddProduct: () => void;
  isLoading?: boolean;
}

export default function ProductFilters({
  filters,
  categories,
  suppliers,
  onFiltersChange,
  onExport,
  onImport,
  onRefresh,
  onAddProduct,
  isLoading
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const { searchProducts } = useInventory();
  const [search, setSearch] = React.useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = React.useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearch(filters.search || '');
  }, [filters.search]);

  React.useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      setSearchLoading(true);
      searchProducts(debouncedSearch.trim()).then((res) => {
        setResults(res);
        setShowDropdown(true);
      }).finally(() => setSearchLoading(false));
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearch, searchProducts]);

  // Close dropdown on outside click or ESC
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setHighlighted(-1);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setHighlighted(-1);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlighted((prev) => (prev + 1) % results.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted((prev) => (prev - 1 + results.length) % results.length);
      e.preventDefault();
    } else if (e.key === 'Enter' && highlighted >= 0 && highlighted < results.length) {
      handleSelect();
      e.preventDefault();
    }
  };

  const handleSelect = () => {
    setShowDropdown(false);
    setHighlighted(-1);
    setSearch('');
    onFiltersChange({ ...filters, search: '' });
    // You can call a prop like onAddProduct(product) here if needed
  };

  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      handleFilterChange('category_id', '');
      handleFilterChange('subcategory_id', '');
    } else {
      handleFilterChange('category_id', value);
      handleFilterChange('subcategory_id', '');
    }
  };

  const handleSubcategoryChange = (value: string) => {
    if (value === 'all') {
      handleFilterChange('subcategory_id', '');
    } else {
      handleFilterChange('subcategory_id', value);
    }
  };

  const handleSupplierChange = (value: string) => {
    if (value === 'all') {
      handleFilterChange('supplier_id', '');
    } else {
      handleFilterChange('supplier_id', value);
    }
  };

  const handleStockStatusChange = (value: string) => {
    handleFilterChange('low_stock_only', value === 'low');
  };

  const handleActiveStatusChange = (value: string) => {
    handleFilterChange('is_active', value === 'active');
  };

  const selectedCategory = categories.find(c => c.id === filters.category_id);

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      category_id: '',
      subcategory_id: '',
      supplier_id: '',
      low_stock_only: false,
      is_active: true
    });
  };

  const activeFiltersCount = [
    filters.search,
    filters.category_id,
    filters.subcategory_id,
    filters.supplier_id,
    filters.low_stock_only
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-lg">Product Filters</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
            <Button onClick={onAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.addProduct')}
            </Button>
            <BarcodeScanButton
              onScan={(barcode) => {
                setSearch(barcode);
                onFiltersChange({ ...filters, search: barcode });
              }}
              size="icon"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Scan barcode"
            />
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              {t('common.import')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={`${t('common.search')} products, codes, or barcodes...`}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              onFiltersChange({ ...filters, search: e.target.value });
            }}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
            autoComplete="off"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <BarcodeScanButton
              onScan={(barcode) => {
                setSearch(barcode);
                onFiltersChange({ ...filters, search: barcode });
              }}
              size="icon"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Scan barcode"
            />
          </div>
          {/* Dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {searchLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Searching...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t('common.noResults') || 'No matching products found'}
                </div>
              ) : (
                results.map((product: Product, idx: number) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-accent ${highlighted === idx ? 'bg-accent' : ''}`}
                    onMouseDown={() => handleSelect()}
                    tabIndex={-1}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.product_code} • {product.barcode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.quantity_in_stock <= 0 ? (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Out of stock</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs px-2 py-1"
                          onMouseDown={e => {
                            e.stopPropagation();
                            handleSelect();
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>{t('inventory.category')}</Label>
            <Select
              value={filters.category_id || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory?.children && selectedCategory.children.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select
                value={filters.subcategory_id || 'all'}
                onValueChange={handleSubcategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subcategories</SelectItem>
                  {selectedCategory.children.map(subcategory => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('inventory.supplier')}</Label>
            <Select
              value={filters.supplier_id || 'all'}
              onValueChange={handleSupplierChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={filters.low_stock_only ? 'low' : 'all'}
              onValueChange={handleStockStatusChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="low">Low stock only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.is_active ? 'active' : 'inactive'}
              onValueChange={handleActiveStatusChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active products</SelectItem>
                <SelectItem value="inactive">Inactive products</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.category_id && (
              <Badge variant="secondary" className="gap-1">
                Category: {categories.find(c => c.id === filters.category_id)?.name}
                <button
                  onClick={() => handleFilterChange('category_id', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.supplier_id && (
              <Badge variant="secondary" className="gap-1">
                Supplier: {suppliers.find(s => s.id === filters.supplier_id)?.name}
                <button
                  onClick={() => handleFilterChange('supplier_id', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.low_stock_only && (
              <Badge variant="secondary" className="gap-1">
                Low stock only
                <button
                  onClick={() => handleFilterChange('low_stock_only', false)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}