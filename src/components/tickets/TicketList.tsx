import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Clock, CheckCircle, AlertTriangle, Package, Smartphone, Wrench, Copy } from 'lucide-react';
import { ServiceTicket } from '../../types/tickets';
import { UnifiedTable } from '../common/UnifiedTable';

interface TicketListProps {
  tickets: ServiceTicket[];
  onView: (ticket: ServiceTicket) => void;
  onEdit: (ticket: ServiceTicket) => void;
  loading?: boolean;
}

function CopiableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const short = value.length > 8 ? value.slice(0, 8) + '...' : value;
  return (
    <button
      className="inline-flex items-center gap-1 group text-xs font-mono px-1 py-0.5 rounded hover:bg-black-100 active:bg-black-200 border border-transparent hover:border-black-200 transition cursor-pointer"
      title={copied ? 'Copied!' : 'Copy'}
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      <span>{short}</span>
      <Copy className={`w-3 h-3 ${copied ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
    </button>
  );
}

export default function TicketList({ tickets, onView, onEdit, loading }: TicketListProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Sorting logic
  const sortedTickets = [...tickets].sort((a, b) => {
    const aVal = a[sortKey as keyof ServiceTicket];
    const bVal = b[sortKey as keyof ServiceTicket];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDir === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
    }
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const columns = [
    {
      key: 'ticket_number',
      label: t('tickets.ticketNumber'),
      render: (ticket: ServiceTicket) => (
        <div className="flex items-center gap-2">
          {ticket.type === 'repair' ? <Wrench className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
          <CopiableId value={ticket.ticket_number} />
        </div>
      ),
      className: 'min-w-[120px]'
    },
    {
      key: 'customer',
      label: t('tickets.customer'),
      render: (ticket: ServiceTicket) => (
        <div>
          <div className="font-medium">{ticket.customer?.name}</div>
          <div className="text-xs text-muted-foreground">{ticket.customer?.phone}</div>
        </div>
      ),
      className: 'min-w-[140px]'
    },
    {
      key: 'type',
      label: t('tickets.type'),
      render: (ticket: ServiceTicket) => t(`tickets.${ticket.type}`),
      className: 'min-w-[80px]'
    },
    {
      key: 'priority',
      label: t('tickets.priority'),
      render: (ticket: ServiceTicket) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} dark:bg-background dark:text-foreground`}>
          {t(`tickets.${ticket.priority}`)}
        </span>
      ),
      className: 'min-w-[80px]'
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (ticket: ServiceTicket) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} dark:bg-background dark:text-foreground`}>
          {getStatusIcon(ticket.status)}
          <span className="ml-1">{t(`tickets.${ticket.status}`)}</span>
        </span>
      ),
      className: 'min-w-[100px]'
    },
    {
      key: 'technician',
      label: t('tickets.technician'),
      render: (ticket: ServiceTicket) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-foreground">
            {ticket.technician?.name || (
              <span className="text-muted-foreground">{t('tickets.unassigned')}</span>
            )}
          </div>
          {ticket.technician?.specialization && (
            <div className="text-xs text-muted-foreground">
              {ticket.technician.specialization}
            </div>
          )}
        </div>
      ),
      className: 'min-w-[120px]'
    },
    {
      key: 'price_quote',
      label: t('tickets.quote'),
      render: (ticket: ServiceTicket) => (
        <div>
          <span className="text-sm font-medium">{formatCurrency(ticket.price_quote)}</span>
          {ticket.paid && (
            <span className="ml-2 text-xs text-green-400 font-medium">{t('tickets.paid')}</span>
          )}
        </div>
      ),
      className: 'min-w-[80px]'
    },
    {
      key: 'created_at',
      label: t('common.date'),
      render: (ticket: ServiceTicket) => (
        <div>
          <div className="text-sm">{new Date(ticket.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_parts':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border shadow rounded-lg dark:bg-card/80">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-card border border-border shadow rounded-lg dark:bg-card/80">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {t('tickets.noTicketsFound')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('tickets.getStartedMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedTable
      columns={columns.map(col => ({
        ...col,
        label: (
          <button
            type="button"
            className={`flex items-center gap-1 group bg-transparent border-0 p-0 m-0 text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.className || ''}`}
            onClick={() => handleSort(col.key as string)}
            tabIndex={-1}
            style={{ background: 'none' }}
          >
            {col.label}
            {sortKey === col.key && (
              <span className="ml-1">
                {sortDir === 'asc' ? '▲' : '▼'}
              </span>
            )}
          </button>
        )
      }))}
      data={sortedTickets}
      loading={loading}
      emptyMessage={t('tickets.noTicketsFound')}
      rowKey={t => t.id}
      actions={ticket => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(ticket)}
            className="text-blue-600 hover:text-blue-900"
            title={t('common.view')}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(ticket)}
            className="text-indigo-600 hover:text-indigo-900"
            title={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  );
}