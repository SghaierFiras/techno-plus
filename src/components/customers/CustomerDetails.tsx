import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer, CustomerStats, CustomerServiceTicket } from '../../types/customer';
import { customerService } from '../../lib/customerService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Building, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface CustomerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export default function CustomerDetails({ open, onOpenChange, customer }: CustomerDetailsProps) {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [tickets, setTickets] = useState<CustomerServiceTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Load customer data
  useEffect(() => {
    if (open && customer) {
      loadCustomerData();
    }
  }, [open, customer]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [statsData, ticketsData] = await Promise.all([
        customerService.getCustomerStats(customer.id),
        customerService.getCustomerTickets(customer.id)
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      awaiting_parts: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      canceled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {t(`tickets.status.${status}`)}
      </Badge>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={priorityColors[priority] || 'bg-gray-100 text-gray-800'}>
        {t(`tickets.priority.${priority}`)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer.customer_type === 'individual' ? (
              <User className="h-5 w-5" />
            ) : (
              <Building className="h-5 w-5" />
            )}
            {customer.full_name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('customers.information')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('customers.email')}:</span>
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('customers.phone')}:</span>
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customer.customer_type === 'individual' ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Building className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{t('customers.type')}:</span>
                      <span>{t(`customers.${customer.customer_type}`)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">{t('customers.address')}:</span>
                          <p className="text-sm text-muted-foreground">{customer.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('customers.createdAt')}:</span>
                      <span>{formatDate(customer.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('customers.updatedAt')}:</span>
                      <span>{formatDate(customer.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Statistics */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('customers.statistics')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total_tickets}</div>
                      <div className="text-sm text-muted-foreground">{t('customers.totalTickets')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.completed_tickets}</div>
                      <div className="text-sm text-muted-foreground">{t('customers.completedTickets')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(stats.total_spent)}</div>
                      <div className="text-sm text-muted-foreground">{t('customers.totalSpent')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(stats.average_ticket_value)}</div>
                      <div className="text-sm text-muted-foreground">{t('customers.averageTicketValue')}</div>
                    </div>
                  </div>
                  {stats.last_visit && (
                    <div className="mt-4 text-center">
                      <div className="text-sm text-muted-foreground">
                        {t('customers.lastVisit')}: {formatDate(stats.last_visit)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Service Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('customers.serviceHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('customers.noServiceHistory')}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tickets.ticketNumber')}</TableHead>
                        <TableHead>{t('tickets.type')}</TableHead>
                        <TableHead>{t('tickets.status')}</TableHead>
                        <TableHead>{t('tickets.priority')}</TableHead>
                        <TableHead>{t('tickets.price')}</TableHead>
                        <TableHead>{t('tickets.createdAt')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                          <TableCell>{t(`tickets.type.${ticket.type}`)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{formatCurrency(ticket.final_price || ticket.price_quote)}</TableCell>
                          <TableCell>{formatDate(ticket.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 