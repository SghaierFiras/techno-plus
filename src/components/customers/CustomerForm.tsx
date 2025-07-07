import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer, CustomerFormData } from '../../types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerFormData) => void;
  customer?: Customer;
  title: string;
}

export default function CustomerForm({ open, onOpenChange, onSubmit, customer, title }: CustomerFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: '',
    email: '',
    phone: '',
    customer_type: 'individual',
    address: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form with customer data when editing
  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        customer_type: customer.customer_type || 'individual',
        address: customer.address || '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        customer_type: 'individual',
        address: '',
      });
    }
    setErrors({});
  }, [customer, open]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('customers.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('customers.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('customers.errors.emailInvalid');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('customers.errors.phoneRequired');
    } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = t('customers.errors.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('customers.name')} *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder={t('customers.namePlaceholder')}
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('customers.email')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('customers.emailPlaceholder')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t('customers.phone')} *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('customers.phonePlaceholder')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Customer Type */}
            <div className="space-y-2">
              <Label htmlFor="customer_type">{t('customers.type')} *</Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value) => handleInputChange('customer_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('customers.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">{t('customers.individual')}</SelectItem>
                  <SelectItem value="business">{t('customers.business')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">{t('customers.address')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('customers.addressPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : (customer ? t('common.update') : t('customers.create'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 