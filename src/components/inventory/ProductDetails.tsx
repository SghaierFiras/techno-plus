import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Tag, DollarSign, AlertTriangle, Edit } from 'lucide-react';
import { Product } from '../../types/inventory';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetails({ product, onClose, onEdit }: ProductDetailsProps) {
  const { t } = useTranslation();

  const getStockStatus = () => {
    if (product.quantity_in_stock === 0) {
      return { status: 'out-of-stock', variant: 'destructive' as const, text: 'Out of Stock' };
    } else if (product.quantity_in_stock <= product.min_stock_level) {
      return { status: 'low-stock', variant: 'secondary' as const, text: 'Low Stock' };
    } else {
      return { status: 'in-stock', variant: 'default' as const, text: 'In Stock' };
    }
  };

  const stockStatus = getStockStatus();
  const profitMargin = ((product.selling_price - product.cost_price) / product.selling_price * 100).toFixed(1);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {product.type === 'repair' ? (
                <Package className="h-5 w-5" />
              ) : (
                <Tag className="h-5 w-5" />
              )}
              Product Details - {product.product_code}
            </DialogTitle>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                <h2 className="text-xl font-semibold mb-4">{product.name}</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Product Code:</span>
                    <span className="text-sm font-medium font-mono">{product.product_code}</span>
                  </div>
                  
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Barcode:</span>
                      <span className="text-sm font-medium font-mono">{product.barcode}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={stockStatus.variant} className="gap-1">
                      {stockStatus.status === 'low-stock' && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {stockStatus.text}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {product.category?.name}
                  </Badge>
                  {product.subcategory && (
                    <Badge variant="outline">
                      {product.subcategory.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Cost Price:</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(product.cost_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Selling Price:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(product.selling_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Profit Margin:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Stock:</span>
                    <span className="text-lg font-semibold">
                      {product.quantity_in_stock} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Minimum Stock:</span>
                    <span className="text-lg font-semibold text-yellow-600">
                      {product.min_stock_level} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Value:</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {formatCurrency(product.quantity_in_stock * product.cost_price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supplier */}
            {(product.supplier_info || product.supplier) && (
              <Card>
                <CardHeader>
                  <CardTitle>Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {product.supplier_info?.name || product.supplier}
                  </p>
                  {product.supplier_info?.contact_person && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact: {product.supplier_info.contact_person}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {variant.name}: {variant.value}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.additional_cost > 0 ? `+${formatCurrency(variant.additional_cost)}` : 'No additional cost'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{variant.quantity_in_stock} units</div>
                          {variant.barcode && (
                            <div className="text-xs text-muted-foreground font-mono">{variant.barcode}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(product.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}