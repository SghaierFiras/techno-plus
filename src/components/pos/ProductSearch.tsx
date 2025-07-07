import React, { useEffect, useRef, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Product, ProductVariant } from '../../types/inventory';
import { useInventory } from '../../hooks/useInventory';

interface ProductSearchProps {
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  searchQuery: string;
  onClearSearch?: () => void;
}

export default function ProductSearch({ onAddToCart, searchQuery, onClearSearch }: ProductSearchProps) {
  const { searchProducts } = useInventory();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch(searchQuery);
    } else {
      setProducts([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchProducts(query);
      setProducts(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click or ESC
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        if (onClearSearch) onClearSearch();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        if (onClearSearch) onClearSearch();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClearSearch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const handleAddProduct = (product: Product, variant?: ProductVariant) => {
    if (product.quantity_in_stock <= 0) return;
    onAddToCart(product, variant);
    setShowDropdown(false);
    if (onClearSearch) onClearSearch();
  };

  if (!searchQuery || searchQuery.length < 2) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {loading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="p-4 text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">No products found</p>
        </div>
      )}

      {!loading && products.length > 0 && showDropdown && (
        <div className="divide-y divide-gray-100">
          {products.map((product) => (
            <div
              key={product.id}
              className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between`}
              onClick={() => product.quantity_in_stock > 0 && handleAddProduct(product)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.product_code} • {formatCurrency(product.selling_price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.quantity_in_stock} units
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {product.quantity_in_stock <= 0 ? (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Out of stock</span>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleAddProduct(product);
                    }}
                    className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}