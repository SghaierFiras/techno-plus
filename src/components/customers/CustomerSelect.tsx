import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building } from 'lucide-react';
import { Customer } from '../../types/customer';
import { customerService } from '../../lib/customerService';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomerSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CustomerSelect({ value, onValueChange, placeholder, disabled, required }: CustomerSelectProps) {
  const { t } = useTranslation();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected customer
  const selectedCustomer = customers.find(customer => customer.id === value);

  // Get customer type badge
  const getCustomerTypeBadge = (type: string) => {
    return type === 'individual' ? (
      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
        <User className="h-3 w-3" />
        {t('customers.individual')}
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Building className="h-3 w-3" />
        {t('customers.business')}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
        {t('customers.selectCustomer')}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || t('customers.selectCustomer')}>
            {selectedCustomer && (
              <div className="flex items-center gap-2">
                <span>{selectedCustomer.full_name}</span>
                {getCustomerTypeBadge(selectedCustomer.customer_type)}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">
              {t('common.loading')}...
            </div>
          ) : customers.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">
              {t('customers.noCustomersFound')}
            </div>
          ) : (
            customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{customer.full_name}</span>
                    <span className="text-sm text-muted-foreground">({customer.email})</span>
                  </div>
                  {getCustomerTypeBadge(customer.customer_type)}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 