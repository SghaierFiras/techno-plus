import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Edit, Clock, User, Wrench, Smartphone, FileText, DollarSign, Calendar } from 'lucide-react';
import { ServiceTicket, TicketStatusHistory } from '../../types/tickets';

interface TicketDetailsProps {
  ticket: ServiceTicket;
  statusHistory: TicketStatusHistory[];
  onClose: () => void;
  onEdit: () => void;
}

export default function TicketDetails({ ticket, statusHistory, onClose, onEdit }: TicketDetailsProps) {
  const { t } = useTranslation();

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

  const getStatusSteps = () => {
    const allSteps = ['new', 'in_progress', 'awaiting_parts', 'completed', 'delivered'];
    const currentIndex = allSteps.indexOf(ticket.status);
    
    return allSteps.map((step, index) => ({
      status: step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            {ticket.type === 'repair' ? (
              <Wrench className="h-6 w-6 text-blue-600" />
            ) : (
              <Smartphone className="h-6 w-6 text-green-600" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {t('tickets.ticketDetails')} - {ticket.ticket_number}
              </h3>
              <p className="text-sm text-gray-500">
                {t(`tickets.${ticket.type}`)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Progress */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t('tickets.statusProgress')}
              </h4>
              <div className="flex items-center justify-between">
                {getStatusSteps().map((step, index) => (
                  <div key={step.status} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step.completed 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {step.completed ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-2 text-xs">
                      <div className={`font-medium ${step.completed ? 'text-blue-600' : 'text-gray-500'}`}>
                        {t(`tickets.${step.status}`)}
                      </div>
                    </div>
                    {index < getStatusSteps().length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        step.completed ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('tickets.customerInformation')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('common.name')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{ticket.customer?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('tickets.phone')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{ticket.customer?.phone}</p>
                </div>
                {ticket.customer?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.email')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.customer.email}</p>
                  </div>
                )}
                {ticket.customer?.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.address')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.customer.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Device/Service Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {ticket.type === 'repair' ? t('tickets.deviceInformation') : t('tickets.serviceDetails')}
              </h4>
              
              {ticket.type === 'repair' && ticket.device_info ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.brand')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.device_info.brand}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.model')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.device_info.model}</p>
                  </div>
                  {ticket.device_info.serialNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.serialNumber')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{ticket.device_info.serialNumber}</p>
                    </div>
                  )}
                  {ticket.device_info.condition && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.condition')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {t(`tickets.${ticket.device_info.condition}`)}
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.problemDescription')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.device_info.problemDescription}</p>
                  </div>
                  {ticket.device_info.accessories && ticket.device_info.accessories.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.accessories')}
                      </label>
                      <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                        {ticket.device_info.accessories.map((accessory, index) => (
                          <li key={index}>{accessory}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : ticket.service_details ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('tickets.serviceType')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.service_details.serviceType}</p>
                  </div>
                  {ticket.service_details.provider && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.provider')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{ticket.service_details.provider}</p>
                    </div>
                  )}
                  {ticket.service_details.accountNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.accountNumber')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{ticket.service_details.accountNumber}</p>
                    </div>
                  )}
                  {ticket.service_details.amount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        {t('tickets.amount')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatCurrency(ticket.service_details.amount)}
                      </p>
                    </div>
                  )}
                  {ticket.service_details.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">
                        {t('common.description')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{ticket.service_details.description}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Notes */}
            {ticket.notes && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {t('tickets.notes')}
                </h4>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t('tickets.ticketSummary')}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('common.status')}:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {t(`tickets.${ticket.status}`)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.priority')}:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {t(`tickets.${ticket.priority}`)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.technician')}:</span>
                  <span className="text-sm text-gray-900">
                    {ticket.technician?.name || t('tickets.unassigned')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.created')}:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.lastUpdated')}:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                {t('tickets.pricing')}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.quote')}:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(ticket.price_quote)}
                  </span>
                </div>
                {ticket.final_price && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('tickets.finalPrice')}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(ticket.final_price)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t('tickets.paymentStatus')}:</span>
                  <span className={`text-sm font-medium ${ticket.paid ? 'text-green-600' : 'text-red-600'}`}>
                    {ticket.paid ? t('tickets.paid') : t('tickets.unpaid')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status History */}
            {statusHistory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('tickets.statusHistory')}
                </h4>
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {history.old_status 
                              ? `${t(`tickets.${history.old_status}`)} → ${t(`tickets.${history.new_status}`)}`
                              : t(`tickets.${history.new_status}`)
                            }
                          </p>
                          {history.notes && (
                            <p className="text-xs text-gray-500 mt-1">{history.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(history.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}