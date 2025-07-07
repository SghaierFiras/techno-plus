import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Cart } from '../../types/pos';

interface CartDisplayProps {
  cart: Cart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (percentage?: number, amount?: number) => void;
  currency?: string;
}

export default function CartDisplay({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onApplyDiscount,
  currency = 'CAD'
}: CartDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const handleDiscountSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const discountType = formData.get('discountType') as string;
    const discountValue = parseFloat(formData.get('discountValue') as string) || 0;

    if (discountType === 'percentage') {
      onApplyDiscount(discountValue);
    } else {
      onApplyDiscount(undefined, discountValue);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 dark:bg-card/80">
        <div className="text-center py-8">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Empty Cart</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan a barcode or search for products to add them to the cart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm dark:bg-card/80">
      {/* Cart Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Cart ({cart.items.length} items)
        </h3>
      </div>

      {/* Cart Items */}
      <div className="max-h-96 overflow-y-auto">
        {cart.items.map((item) => (
          <div key={item.id} className="px-4 py-3 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.product_code} {item.barcode && `• ${item.barcode}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Price */}
                <div className="text-right min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(item.subtotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.price)} each
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 rounded-full hover:bg-destructive/20 text-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Section */}
      <div className="px-4 py-3 border-b border-border bg-muted dark:bg-muted/40">
        <form onSubmit={handleDiscountSubmit} className="flex items-center space-x-2">
          <select
            name="discountType"
            className="text-sm border-border rounded-md focus:ring-primary focus:border-primary bg-background text-foreground dark:bg-background/80"
            defaultValue="percentage"
          >
            <option value="percentage">% Discount</option>
            <option value="amount">$ Discount</option>
          </select>
          <input
            type="number"
            name="discountValue"
            step="0.01"
            min="0"
            placeholder="0"
            className="flex-1 text-sm border-border rounded-md focus:ring-primary focus:border-primary bg-background text-foreground dark:bg-background/80"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/80"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Cart Summary */}
      <div className="px-4 py-3 bg-muted dark:bg-muted/40">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
          </div>
          
          {cart.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>
                Discount {cart.discount_percentage > 0 && `(${cart.discount_percentage}%)`}:
              </span>
              <span>-{formatCurrency(cart.discount_amount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium">{formatCurrency(cart.tax_amount)}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
            <span>Total:</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}