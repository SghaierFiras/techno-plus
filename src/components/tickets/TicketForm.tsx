import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Search, User, Wrench, Smartphone } from 'lucide-react';
import { TicketFormData, Customer, Technician, DIGITAL_SERVICE_TYPES, SERVICE_PROVIDERS } from '../../types/tickets';

interface TicketFormProps {
  customers: Customer[];
  technicians: Technician[];
  onSubmit: (data: TicketFormData) => Promise<void>;
  onCancel: () => void;
  onCreateCustomer: (customer: { name: string; phone: string; email?: string }) => Promise<Customer>;
  isLoading?: boolean;
}

export default function TicketForm({ 
  customers, 
  technicians, 
  onSubmit, 
  onCancel, 
  onCreateCustomer,
  isLoading 
}: TicketFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<TicketFormData>({
    type: 'repair',
    customer_id: '',
    priority: 'medium',
    price_quote: 0,
    device_info: {
      brand: '',
      model: '',
      serialNumber: '',
      problemDescription: '',
      condition: '',
      accessories: []
    },
    service_details: {
      serviceType: '',
      provider: '',
      accountNumber: '',
      amount: 0,
      description: '',
      additionalInfo: ''
    }
  });

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers.slice(0, 10));
    }
  }, [customerSearch, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof TicketFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeviceInfoChange = (field: string, value: string | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      device_info: { ...prev.device_info!, [field]: value }
    }));
  };

  const handleServiceDetailsChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      service_details: { ...prev.service_details!, [field]: value }
    }));
  };

  const handleCreateNewCustomer = async () => {
    try {
      const customer = await onCreateCustomer(newCustomer);
      setFormData(prev => ({ ...prev, customer_id: customer.id }));
      setShowNewCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const addAccessory = () => {
    const accessories = formData.device_info?.accessories || [];
    handleDeviceInfoChange('accessories', [...accessories, '']);
  };

  const updateAccessory = (index: number, value: string) => {
    const accessories = [...(formData.device_info?.accessories || [])];
    accessories[index] = value;
    handleDeviceInfoChange('accessories', accessories);
  };

  const removeAccessory = (index: number) => {
    const accessories = formData.device_info?.accessories || [];
    handleDeviceInfoChange('accessories', accessories.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-background/80 dark:bg-background/90 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-border w-11/12 max-w-4xl shadow-lg rounded-md bg-card dark:bg-card/80">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-foreground">
            {t('tickets.createTicket')}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('tickets.ticketType')} *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'repair')}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 ${
                  formData.type === 'repair' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-accent'
                }`}
              >
                <Wrench className="h-8 w-8" />
                <span className="font-medium">{t('tickets.repairTicket')}</span>
                <span className="text-sm text-muted-foreground">{t('tickets.repairDescription')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleInputChange('type', 'digital_service')}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 ${
                  formData.type === 'digital_service' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-accent'
                }`}
              >
                <Smartphone className="h-8 w-8" />
                <span className="font-medium">{t('tickets.digitalService')}</span>
                <span className="text-sm text-muted-foreground">{t('tickets.digitalServiceDescription')}</span>
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tickets.customer')} *
            </label>
            
            {!showNewCustomer ? (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('tickets.searchCustomers')}
                  />
                </div>
                
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange('customer_id', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">{t('tickets.selectCustomer')}</option>
                  {filteredCustomers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <User className="h-4 w-4 mr-2" />
                  {t('tickets.newCustomer')}
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-900">{t('tickets.newCustomer')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('common.name')} *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('tickets.phone')} *
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('tickets.email')}
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCreateNewCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Repair Ticket Fields */}
          {formData.type === 'repair' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">{t('tickets.deviceInformation')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.brand')} *
                  </label>
                  <input
                    type="text"
                    value={formData.device_info?.brand || ''}
                    onChange={(e) => handleDeviceInfoChange('brand', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.model')} *
                  </label>
                  <input
                    type="text"
                    value={formData.device_info?.model || ''}
                    onChange={(e) => handleDeviceInfoChange('model', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.serialNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.device_info?.serialNumber || ''}
                    onChange={(e) => handleDeviceInfoChange('serialNumber', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.condition')}
                  </label>
                  <select
                    value={formData.device_info?.condition || ''}
                    onChange={(e) => handleDeviceInfoChange('condition', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('tickets.selectCondition')}</option>
                    <option value="excellent">{t('tickets.excellent')}</option>
                    <option value="good">{t('tickets.good')}</option>
                    <option value="fair">{t('tickets.fair')}</option>
                    <option value="poor">{t('tickets.poor')}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('tickets.problemDescription')} *
                </label>
                <textarea
                  rows={3}
                  value={formData.device_info?.problemDescription || ''}
                  onChange={(e) => handleDeviceInfoChange('problemDescription', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Accessories */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.accessories')}
                  </label>
                  <button
                    type="button"
                    onClick={addAccessory}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('common.add')}
                  </button>
                </div>
                
                {formData.device_info?.accessories?.map((accessory, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={accessory}
                      onChange={(e) => updateAccessory(index, e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('tickets.accessoryPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => removeAccessory(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Digital Service Fields */}
          {formData.type === 'digital_service' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">{t('tickets.serviceDetails')}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.serviceType')} *
                  </label>
                  <select
                    value={formData.service_details?.serviceType || ''}
                    onChange={(e) => handleServiceDetailsChange('serviceType', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{t('tickets.selectServiceType')}</option>
                    {DIGITAL_SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {t(`tickets.serviceTypes.${type.toLowerCase().replace(/\s+/g, '_')}`, type)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.provider')}
                  </label>
                  <select
                    value={formData.service_details?.provider || ''}
                    onChange={(e) => handleServiceDetailsChange('provider', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('tickets.selectProvider')}</option>
                    {SERVICE_PROVIDERS.map(provider => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.accountNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.service_details?.accountNumber || ''}
                    onChange={(e) => handleServiceDetailsChange('accountNumber', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('tickets.amount')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.service_details?.amount || 0}
                    onChange={(e) => handleServiceDetailsChange('amount', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('common.description')}
                </label>
                <textarea
                  rows={3}
                  value={formData.service_details?.description || ''}
                  onChange={(e) => handleServiceDetailsChange('description', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('tickets.priority')} *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="low">{t('tickets.low')}</option>
                <option value="medium">{t('tickets.medium')}</option>
                <option value="high">{t('tickets.high')}</option>
                <option value="urgent">{t('tickets.urgent')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('tickets.priceQuote')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_quote}
                onChange={(e) => handleInputChange('price_quote', parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('tickets.assignTechnician')}
              </label>
              <select
                value={formData.technician_id || ''}
                onChange={(e) => handleInputChange('technician_id', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('tickets.unassigned')}</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} {tech.specialization && `(${tech.specialization})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('tickets.notes')}
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('tickets.notesPlaceholder')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('common.loading') : t('tickets.createTicket')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}