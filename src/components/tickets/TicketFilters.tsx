import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Download, Plus } from 'lucide-react';
import { TicketFilters, Technician } from '../../types/tickets';

interface TicketFiltersProps {
  filters: TicketFilters;
  technicians: Technician[];
  onFiltersChange: (filters: TicketFilters) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreateTicket: () => void;
  isLoading?: boolean;
}

export default function TicketFiltersComponent({
  filters,
  technicians,
  onFiltersChange,
  onRefresh,
  onExport,
  onCreateTicket,
  isLoading
}: TicketFiltersProps) {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof TicketFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const statusOptions = [
    { value: '', label: t('tickets.allStatuses') },
    { value: 'received', label: t('tickets.received') },
    { value: 'in_progress', label: t('tickets.in_progress') },
    { value: 'completed', label: t('tickets.completed') },
    { value: 'delivered', label: t('tickets.delivered') },
    { value: 'canceled', label: t('tickets.canceled') }
  ];

  const priorityOptions = [
    { value: '', label: t('tickets.allPriorities') },
    { value: 'urgent', label: t('tickets.urgent') },
    { value: 'high', label: t('tickets.high') },
    { value: 'medium', label: t('tickets.medium') },
    { value: 'low', label: t('tickets.low') }
  ];

  return (
    <div className="bg-card border border-border shadow rounded-lg mb-6 dark:bg-card/80">
      <div className="px-4 py-5 sm:p-6">
        {/* Header with Create Button */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium tracking-light mb-2">
              {t('tickets.filterTickets')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onCreateTicket}
              className="inline-flex items-center px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('tickets.createTicket')}
            </button>
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 dark:bg-background/80"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </button>
            
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-background/80"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm dark:bg-background/80"
              placeholder={t('tickets.searchPlaceholder')}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tickets.type')}
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
            >
              <option value="all">{t('tickets.allTypes')}</option>
              <option value="repair">{t('tickets.repairTicket')}</option>
              <option value="digital_service">{t('tickets.digitalService')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tickets.priority')}
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tickets.technician')}
            </label>
            <select
              value={filters.technician_id}
              onChange={(e) => handleFilterChange('technician_id', e.target.value)}
              className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
            >
              <option value="">{t('tickets.allTechnicians')}</option>
              <option value="unassigned">{t('tickets.unassigned')}</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tickets.dateRange')}
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground sm:text-sm dark:bg-background/80"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.type !== 'all' || filters.status || filters.priority || filters.technician_id || filters.date_from || filters.date_to) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">{t('inventory.activeFilters')}:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t('common.search')}: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.type !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t('tickets.type')}: {t(`tickets.${filters.type}`)}
                <button
                  onClick={() => handleFilterChange('type', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {t('common.status')}: {t(`tickets.${filters.status}`)}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={() => onFiltersChange({
                search: '',
                type: 'all',
                status: '',
                priority: '',
                technician_id: '',
                date_from: '',
                date_to: ''
              })}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {t('inventory.clearAllFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}