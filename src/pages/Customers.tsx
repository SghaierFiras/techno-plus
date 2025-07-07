import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Edit, Trash2, Eye, User, Building } from 'lucide-react';
import { Customer, CustomerFilters, CustomerFormData } from '../types/customer';
import { customerService } from '../lib/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerDetails from '@/components/customers/CustomerDetails';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { UnifiedTable } from '@/components/common/UnifiedTable';

export default function Customers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customer_type: 'all',
    date_from: '',
    date_to: '',
  });
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers(filters);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: t('error'),
        description: t('customers.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle customer creation
  const handleCreateCustomer = async (customerData: CustomerFormData) => {
    try {
      await customerService.createCustomer(customerData);
      toast({
        title: t('success'),
        description: t('customers.created'),
      });
      setShowCreateForm(false);
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: t('error'),
        description: t('customers.createError'),
        variant: 'destructive',
      });
    }
  };

  // Handle customer update
  const handleUpdateCustomer = async (customerData: Partial<CustomerFormData>) => {
    if (!selectedCustomer) return;
    
    try {
      await customerService.updateCustomer(selectedCustomer.id, customerData);
      toast({
        title: t('success'),
        description: t('customers.updated'),
      });
      setShowEditForm(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: t('error'),
        description: t('customers.updateError'),
        variant: 'destructive',
      });
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      await customerService.deleteCustomer(selectedCustomer.id);
      toast({
        title: t('success'),
        description: t('customers.deleted'),
      });
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: t('error'),
        description: t('customers.deleteError'),
        variant: 'destructive',
      });
    }
  };

  // Handle row actions
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditForm(true);
  };

  const handleDeleteCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteConfirm(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get customer type badge
  const getCustomerTypeBadge = (type: string) => {
    return type === 'individual' ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        {t('customers.individual')}
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <Building className="h-3 w-3" />
        {t('customers.business')}
      </Badge>
    );
  };

  const columns = [
    { key: 'full_name', label: t('customers.name') },
    { key: 'email', label: t('customers.email') },
    { key: 'phone', label: t('customers.phone') },
    { key: 'customer_type', label: t('customers.type'), render: (c: Customer) => getCustomerTypeBadge(c.customer_type) },
    { key: 'created_at', label: t('customers.createdAt'), render: (c: Customer) => formatDate(c.created_at) },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 px-4 md:px-8 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title')}</h1>
          <p className="text-muted-foreground">{t('customers.description')}</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('customers.addNew')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border border-border dark:bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('customers.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('customers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-background border-border text-foreground dark:bg-background/80"
              />
            </div>
            <Select value={filters.customer_type} onValueChange={(value) => handleFilterChange('customer_type', value)}>
              <SelectTrigger className="bg-background border-border text-foreground dark:bg-background/80">
                <SelectValue placeholder={t('customers.selectType')} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground dark:bg-background/80">
                <SelectItem value="all">{t('customers.allTypes')}</SelectItem>
                <SelectItem value="individual">{t('customers.individual')}</SelectItem>
                <SelectItem value="business">{t('customers.business')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              placeholder={t('customers.dateFrom')}
              className="bg-background border-border text-foreground dark:bg-background/80"
            />
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              placeholder={t('customers.dateTo')}
              className="bg-background border-border text-foreground dark:bg-background/80"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <UnifiedTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage={t('customers.noCustomers')}
        rowKey={c => c.id}
        actions={customer => (
          <div className="flex items-center justify-end gap-2">
            <button
              className="text-blue-600 hover:text-blue-900"
              onClick={() => handleViewCustomer(customer)}
              title={t('common.view')}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="text-indigo-600 hover:text-indigo-900"
              onClick={() => handleEditCustomer(customer)}
              title={t('common.edit')}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="text-red-600 hover:text-red-900"
              onClick={() => handleDeleteCustomerClick(customer)}
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modals */}
      {showCreateForm && (
        <CustomerForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateCustomer}
          title={t('customers.addNew')}
        />
      )}

      {showEditForm && selectedCustomer && (
        <CustomerForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          onSubmit={handleUpdateCustomer}
          customer={selectedCustomer}
          title={t('customers.editTitle')}
        />
      )}

      {showDetails && selectedCustomer && (
        <CustomerDetails
          open={showDetails}
          onOpenChange={setShowDetails}
          customer={selectedCustomer}
        />
      )}

      {showDeleteConfirm && selectedCustomer && (
        <DeleteConfirmation
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteCustomer}
          title={t('customers.deleteTitle')}
          description={t('customers.deleteDescription', { name: selectedCustomer.full_name })}
        />
      )}
    </div>
  );
} 