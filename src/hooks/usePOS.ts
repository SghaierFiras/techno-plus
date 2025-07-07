import { useState, useEffect, useCallback } from 'react';
import { CartItem, Cart, Transaction, PaymentMethod, POSSettings } from '../types/pos';
import { Product, ProductVariant } from '../types/inventory';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/syncManager';
import { offlineDB } from '../lib/offlineDB';
import { useToast } from './useToast';

export function usePOS() {
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    discount_amount: 0,
    discount_percentage: 0,
    tax_amount: 0,
    total: 0
  });

  const [settings, setSettings] = useState<POSSettings>({
    tax_rate: 0.13, // 13% HST for Canada
    currency: 'CAD',
    auto_print_receipt: false,
    barcode_scanner_enabled: true,
    sound_enabled: true,
    default_payment_method: 'cash'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load cart from storage on mount
  useEffect(() => {
    loadCartFromStorage();
    loadSettingsFromStorage();
    
    // Subscribe to online status changes
    const unsubscribe = syncManager.onOnlineStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCartToStorage();
  }, [cart]);

  const loadCartFromStorage = async () => {
    const savedCart = await offlineDB.getSetting('pos_cart');
    if (savedCart) {
      setCart(savedCart);
    }
  };

  const saveCartToStorage = async () => {
    await offlineDB.saveSetting('pos_cart', cart);
  };

  const loadSettingsFromStorage = async () => {
    const savedSettings = await offlineDB.getSetting('pos_settings');
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const calculateCart = useCallback((items: CartItem[], discountPercentage = 0, discountAmount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    let totalDiscount = discountAmount;
    if (discountPercentage > 0) {
      totalDiscount = subtotal * (discountPercentage / 100);
    }

    const discountedSubtotal = subtotal - totalDiscount;
    const taxAmount = discountedSubtotal * (settings.tax_rate / 100);
    const total = discountedSubtotal + taxAmount;

    return {
      items,
      subtotal,
      discount_amount: totalDiscount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      total
    };
  }, [settings.tax_rate]);

  const addToCart = useCallback(async (product: Product, variant?: ProductVariant, quantity = 1) => {
    const price = variant ? product.selling_price + variant.additional_cost : product.selling_price;
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.id === itemId);
    
    let newItems: CartItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      newItems = cart.items.map((item, index) => {
        if (index === existingItemIndex) {
          const newQuantity = item.quantity + quantity;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: price * newQuantity
          };
        }
        return item;
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        id: itemId,
        product_id: product.id,
        variant_id: variant?.id,
        name: product.name,
        product_code: product.product_code,
        barcode: variant?.barcode || product.barcode,
        price,
        quantity,
        discount_amount: 0,
        discount_percentage: 0,
        subtotal: price * quantity,
        image_url: product.image_url,
        variant_name: variant ? `${variant.name}: ${variant.value}` : undefined
      };
      
      newItems = [...cart.items, newItem];
    }

    const updatedCart = calculateCart(newItems, cart.discount_percentage, cart.discount_amount);
    setCart(updatedCart);

    // Play sound if enabled
    if (settings.sound_enabled) {
      playBeepSound();
    }
    
    // Show toast notification
    toast({
      title: "Product Added",
      description: `Added ${product.name}${variant ? ` (${variant.name}: ${variant.value})` : ''} to cart`,
    });
  }, [cart, calculateCart, settings.sound_enabled, toast]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const newItems = cart.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          subtotal: item.price * quantity
        };
      }
      return item;
    });

    const updatedCart = calculateCart(newItems, cart.discount_percentage, cart.discount_amount);
    setCart(updatedCart);
  }, [cart, calculateCart]);

  const removeFromCart = useCallback((itemId: string) => {
    const itemToRemove = cart.items.find(item => item.id === itemId);
    const newItems = cart.items.filter(item => item.id !== itemId);
    const updatedCart = calculateCart(newItems, cart.discount_percentage, cart.discount_amount);
    setCart(updatedCart);
    
    if (itemToRemove) {
      toast({
        title: "Product Removed",
        description: `Removed ${itemToRemove.name} from cart`,
      });
    }
  }, [cart, calculateCart, toast]);

  const applyDiscount = useCallback((percentage?: number, amount?: number) => {
    const updatedCart = calculateCart(
      cart.items, 
      percentage || 0, 
      amount || 0
    );
    setCart(updatedCart);
    
    toast({
      title: "Discount Applied",
      description: percentage 
        ? `Applied ${percentage}% discount` 
        : amount 
          ? `Applied $${amount.toFixed(2)} discount` 
          : "Removed discount",
    });
  }, [cart.items, calculateCart, toast]);

  const clearCart = useCallback(async () => {
    const emptyCart: Cart = {
      items: [],
      subtotal: 0,
      discount_amount: 0,
      discount_percentage: 0,
      tax_amount: 0,
      total: 0
    };
    setCart(emptyCart);
    await offlineDB.saveSetting('pos_cart', emptyCart);
    
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from the cart",
    });
  }, [toast]);

  const processTransaction = useCallback(async (paymentMethod: PaymentMethod, customerInfo?: any) => {
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    setIsProcessing(true);

    try {
      const transactionNumber = generateTransactionNumber();
      
      const transaction: Transaction = {
        id: `temp_${Date.now()}`,
        transaction_number: transactionNumber,
        items: cart.items,
        subtotal: cart.subtotal,
        discount_amount: cart.discount_amount,
        tax_amount: cart.tax_amount,
        total: cart.total,
        payment_method: paymentMethod,
        customer_id: customerInfo?.id,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      // Save transaction locally first
      await offlineDB.saveTransaction(transaction);

      if (isOnline) {
        try {
          // Save to database
          const { data, error } = await supabase
            .from('transactions')
            .insert([{
              transaction_number: transaction.transaction_number,
              items: transaction.items,
              subtotal: transaction.subtotal,
              discount_amount: transaction.discount_amount,
              tax_amount: transaction.tax_amount,
              total: transaction.total,
              payment_method: transaction.payment_method,
              customer_id: transaction.customer_id,
              status: transaction.status
            }])
            .select()
            .single();

          if (error) throw error;
          
          transaction.id = data.id;

          // Update product stock
          await updateProductStock(cart.items);
        } catch (error) {
          console.warn('Online transaction save failed, queuing for sync:', error);
          // Queue for sync when online
          await syncManager.queueAction({
            type: 'CREATE_TRANSACTION',
            data: transaction
          });
        }
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'CREATE_TRANSACTION',
          data: transaction
        });
      }

      setLastTransaction(transaction);
      await clearCart();
      
      return transaction;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [cart, clearCart, isOnline]);

  const updateProductStock = async (items: CartItem[]) => {
    for (const item of items) {
      if (item.variant_id) {
        // Update variant stock
        await supabase
          .from('product_variants')
          .update({
            quantity_in_stock: supabase.raw(`quantity_in_stock - ${item.quantity}`)
          })
          .eq('id', item.variant_id);
      } else {
        // Update product stock
        await supabase
          .from('products')
          .update({
            quantity_in_stock: supabase.raw(`quantity_in_stock - ${item.quantity}`)
          })
          .eq('id', item.product_id);
      }
    }
  };

  const generateTransactionNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN${dateStr}${timeStr}${random}`;
  };

  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  };

  const findProductByBarcode = async (barcode: string): Promise<{ product: Product; variant?: ProductVariant } | null> => {
    if (isOnline) {
      try {
        // First try to find by product barcode
        const { data: products, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories!products_category_id_fkey(*),
            supplier_info:suppliers!products_supplier_id_fkey(*),
            variants:product_variants(*)
          `)
          .eq('barcode', barcode)
          .eq('is_active', true)
          .single();

        if (!productError && products) {
          return { product: products };
        }

        // Then try to find by variant barcode
        const { data: variants, error: variantError } = await supabase
          .from('product_variants')
          .select(`
            *,
            product:products!product_variants_product_id_fkey(
              *,
              category:categories!products_category_id_fkey(*),
              supplier_info:suppliers!products_supplier_id_fkey(*),
              variants:product_variants(*)
            )
          `)
          .eq('barcode', barcode)
          .single();

        if (!variantError && variants) {
          return { 
            product: variants.product, 
            variant: variants 
          };
        }
      } catch (error) {
        console.warn('Online barcode search failed, trying offline:', error);
      }
    }

    // Fallback to offline search
    try {
      const product = await syncManager.findOfflineProductByBarcode(barcode);
      if (product) {
        // Check if barcode matches a variant
        const variant = product.variants?.find(v => v.barcode === barcode);
        return { product, variant };
      }
    } catch (error) {
      console.error('Offline barcode search failed:', error);
    }

    return null;
  };

  return {
    cart,
    settings,
    isProcessing,
    lastTransaction,
    isOnline,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    applyDiscount,
    clearCart,
    processTransaction,
    findProductByBarcode,
    setSettings: async (newSettings: POSSettings) => {
      setSettings(newSettings);
      await offlineDB.saveSetting('pos_settings', newSettings);
    }
  };
}