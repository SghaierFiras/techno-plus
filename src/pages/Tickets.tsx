"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, LayoutList, KanbanSquare, Eye, Edit, Clock, CheckCircle, AlertTriangle, GripVertical, Copy } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { ServiceTicket, TicketFilters as TicketFiltersType, TicketFormData, CustomerFormData, TicketStatusHistory } from '../types/tickets';
import TicketForm from '../components/tickets/TicketForm';
import TicketList from '../components/tickets/TicketList';
import TicketFiltersComponent from '../components/tickets/TicketFilters';
import TicketDetails from '../components/tickets/TicketDetails';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/useToast';

const TICKET_STATUSES = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" /> },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  { key: 'delivered', label: 'Delivered', color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="h-4 w-4" /> },
  { key: 'canceled', label: 'Canceled', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
];

export default function Tickets() {
  const { t } = useTranslation();
  const {
    customers,
    technicians,
    loading,
    error,
    createTicket,
    updateTicket,
    createCustomer,
    getTicketStatusHistory,
    filterTickets,
    refreshData
  } = useTickets();

  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<ServiceTicket | null>(null);
  const [statusHistory, setStatusHistory] = useState<TicketStatusHistory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersType>({
    search: '',
    type: 'all',
    status: '',
    priority: '',
    technician_id: '',
    date_from: '',
    date_to: ''
  });
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [kanbanStatus, setKanbanStatus] = useState<string>('');
  const [kanbanPriority, setKanbanPriority] = useState<string>('');

  const filteredTickets = filterTickets(filters);

  const handleCreateTicket = () => {
    setEditingTicket(null);
    setShowForm(true);
  };

  const handleEditTicket = (ticket: ServiceTicket) => {
    setEditingTicket(ticket);
    setShowForm(true);
    setViewingTicket(null);
  };

  const handleViewTicket = async (ticket: ServiceTicket) => {
    setViewingTicket(ticket);
    try {
      const history = await getTicketStatusHistory(ticket.id);
      setStatusHistory(history);
    } catch (error) {
      console.error('Failed to load status history:', error);
      setStatusHistory([]);
    }
  };

  const handleFormSubmit = async (formData: TicketFormData) => {
    try {
      setIsSubmitting(true);
      
      if (editingTicket) {
        await updateTicket(editingTicket.id, formData);
      } else {
        await createTicket(formData);
      }

      setShowForm(false);
      setEditingTicket(null);
    } catch (err) {
      console.error('Error saving ticket:', err);
      // You could add a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (customerData: CustomerFormData) => {
    return await createCustomer(customerData);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality not yet implemented');
  };

  if (error) {
    return (
      <div className="container space-y-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={refreshData}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                {t('errors.tryAgain')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-8 pb-8 min-w-0">
      <div className="sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('tickets.title')}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t('tickets.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground dark:bg-background/80'}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <LayoutList className="h-4 w-4 mr-2" /> Table
          </button>
          <button
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground dark:bg-background/80'}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban View"
          >
            <KanbanSquare className="h-4 w-4 mr-2" /> Kanban
          </button>
        </div>
      </div>

      <TicketFiltersComponent
        filters={filters}
        technicians={technicians}
        onFiltersChange={setFilters}
        onRefresh={refreshData}
        onExport={handleExport}
        onCreateTicket={handleCreateTicket}
        isLoading={loading}
      />

      {viewMode === 'table' ? (
        <TicketList
          tickets={filteredTickets}
          onView={handleViewTicket}
          onEdit={handleEditTicket}
          loading={loading}
        />
      ) : (
        <div className="overflow-x-auto pb-2 px-2">
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={kanbanStatus}
                onChange={e => setKanbanStatus(e.target.value)}
                className="block w-32 border-border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm bg-background text-foreground dark:bg-background/80"
              >
                <option value="">All</option>
                {TICKET_STATUSES.map(s => (
                  <option key={s.key} value={s.key}>{t(`tickets.${s.key}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={kanbanPriority}
                onChange={e => setKanbanPriority(e.target.value)}
                className="block w-32 border-border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm bg-background text-foreground dark:bg-background/80"
              >
                <option value="">All</option>
                <option value="urgent">{t('tickets.urgent')}</option>
                <option value="high">{t('tickets.high')}</option>
                <option value="medium">{t('tickets.medium')}</option>
                <option value="low">{t('tickets.low')}</option>
              </select>
            </div>
          </div>
          <KanbanBoard
            tickets={filteredTickets}
            onView={handleViewTicket}
            onEdit={handleEditTicket}
            loading={loading}
            statusFilter={kanbanStatus}
            priorityFilter={kanbanPriority}
            updateTicket={updateTicket}
            refreshData={refreshData}
          />
        </div>
      )}

      {showForm && (
        <TicketForm
          customers={customers}
          technicians={technicians}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTicket(null);
          }}
          onCreateCustomer={handleCreateCustomer}
          isLoading={isSubmitting}
        />
      )}

      {viewingTicket && (
        <TicketDetails
          ticket={viewingTicket}
          statusHistory={statusHistory}
          onClose={() => setViewingTicket(null)}
          onEdit={() => handleEditTicket(viewingTicket)}
        />
      )}
    </div>
  );
}

function KanbanBoard({ tickets, onView, onEdit, loading, statusFilter, priorityFilter, updateTicket, refreshData }: {
  tickets: ServiceTicket[];
  onView: (t: ServiceTicket) => void;
  onEdit: (t: ServiceTicket) => void;
  loading?: boolean;
  statusFilter?: string;
  priorityFilter?: string;
  updateTicket: (id: string, data: Partial<ServiceTicket>) => Promise<void>;
  refreshData: () => void;
}) {
  const { t } = useTranslation();
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<ServiceTicket | null>(null);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex gap-4">
        {TICKET_STATUSES.map(status => (
          <div key={status.key} className="flex-1">
            <div className="h-8 bg-gray-100 rounded mb-2 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded mb-3 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  const grouped: Record<string, ServiceTicket[]> = {};
  TICKET_STATUSES.forEach(s => { grouped[s.key] = []; });
  tickets
    .filter(ticket =>
      (!statusFilter || ticket.status === statusFilter) &&
      (!priorityFilter || ticket.priority === priorityFilter)
    )
    .forEach(ticket => {
      if (grouped[ticket.status]) grouped[ticket.status].push(ticket);
    });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TICKET_STATUSES.map(status => (
        <div
          key={status.key}
          className={`flex-1 min-w-[280px] max-w-xs transition-colors ${dragOverStatus === status.key ? 'bg-primary' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOverStatus(status.key); }}
          onDragLeave={() => setDragOverStatus(null)}
          onDrop={async e => {
            e.preventDefault();
            setDragOverStatus(null);
            if (draggedTicket && draggedTicket.status !== status.key) {
              await updateTicket(draggedTicket.id, { ...draggedTicket, status: status.key as ServiceTicket['status'] });
              toast({ title: 'Ticket updated', description: `Ticket #${draggedTicket.ticket_number} moved to ${t(`tickets.${status.key}`)}` });
              setDraggedTicket(null);
              refreshData();
            } else if (draggedTicket && draggedTicket.status === status.key) {
              // Optional: shake animation or feedback
            }
          }}
        >
          <Card className="mb-2 bg-card border border-border dark:bg-card/80">
            <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
              {status.icon}
              <CardTitle className="text-base font-semibold">{t(`tickets.${status.key}`)}</CardTitle>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${status.color} dark:bg-background dark:text-foreground`}>{grouped[status.key].length}</span>
            </CardHeader>
          </Card>
          <div className="space-y-3 min-h-[40px]">
            {grouped[status.key].length === 0 && (
              <div className="text-center text-gray-400 text-xs py-4">{t('tickets.noTicketsFound')}</div>
            )}
            {grouped[status.key].map(ticket => (
              <Card
                key={ticket.id}
                className={`shadow border-l-4 border-primary hover:border-primary/80 transition cursor-pointer relative ${draggedTicket?.id === ticket.id ? 'scale-105 shadow-lg z-10 opacity-80' : 'hover:scale-[1.02]'} duration-150 bg-card border-border dark:bg-card/80`}
              >
                <CardContent className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700"><CopiableTicketNumber value={ticket.ticket_number} /></span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color} dark:bg-background dark:text-foreground`}>{t(`tickets.${status.key}`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition"
                      draggable
                      onDragStart={e => { setDraggedTicket(ticket); e.stopPropagation(); }}
                      onDragEnd={() => setDraggedTicket(null)}
                      title="Drag to move"
                      tabIndex={-1}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    <div className="text-sm font-medium text-gray-900 truncate flex-1">
                      {ticket.customer?.name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {ticket.device_info?.brand || ticket.service_details?.serviceType} {ticket.device_info?.model || ticket.service_details?.provider}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} dark:bg-background dark:text-foreground`}>{t(`tickets.${ticket.priority}`)}</span>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); onView(ticket); }} title={t('common.view')} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                      <button onClick={e => { e.stopPropagation(); onEdit(ticket); }} title={t('common.edit')} className="text-indigo-600 hover:text-indigo-900"><Edit className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getPriorityColor(priority: string) {
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
}

function CopiableTicketNumber({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
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