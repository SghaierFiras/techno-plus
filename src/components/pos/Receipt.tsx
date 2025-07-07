import React from 'react';
import { Receipt as ReceiptType } from '../../types/pos';
import { Printer, Mail, Download } from 'lucide-react';

interface ReceiptProps {
  receipt: ReceiptType;
  onPrint: () => void;
  onEmail: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export default function Receipt({ receipt, onPrint, onEmail, onDownload, onClose }: ReceiptProps) {
  const { transaction, store_info } = receipt;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        {/* Receipt Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{store_info.name}</h2>
          <p className="text-sm text-gray-600">{store_info.address}</p>
          <p className="text-sm text-gray-600">{store_info.phone}</p>
          <p className="text-sm text-gray-600">{store_info.email}</p>
        </div>

        {/* Transaction Info */}
        <div className="border-t border-b border-gray-200 py-4 mb-4">
          <div className="flex justify-between text-sm">
            <span>Transaction #:</span>
            <span className="font-mono">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{formatDate(transaction.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment:</span>
            <span className="capitalize">{transaction.payment_method.type}</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {transaction.items.map((item, index) => (
            <div key={index} className="text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
              {item.variant_name && (
                <div className="text-xs text-gray-500 ml-2">
                  {item.variant_name}
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{item.quantity} × {formatCurrency(item.price)}</span>
                <span>{item.product_code}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(transaction.discount_amount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Tax:</span>
            <span>{formatCurrency(transaction.tax_amount)}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
            <span>Total:</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>

          {/* Payment Details */}
          <div className="mt-4 pt-2 border-t border-gray-200">
            {transaction.payment_method.type === 'cash' && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Cash Paid:</span>
                  <span>{formatCurrency(transaction.payment_method.cash_amount || 0)}</span>
                </div>
                {transaction.payment_method.change_due && transaction.payment_method.change_due > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Change:</span>
                    <span>{formatCurrency(transaction.payment_method.change_due)}</span>
                  </div>
                )}
              </>
            )}
            
            {transaction.payment_method.type === 'mixed' && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Cash:</span>
                  <span>{formatCurrency(transaction.payment_method.cash_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Card:</span>
                  <span>{formatCurrency(transaction.payment_method.card_amount || 0)}</span>
                </div>
                {transaction.payment_method.change_due && transaction.payment_method.change_due > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Change:</span>
                    <span>{formatCurrency(transaction.payment_method.change_due)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Thank you for your business!</p>
          <p className="text-xs text-gray-500">Please keep this receipt for your records</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-6">
          <button
            onClick={onPrint}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </button>
          <button
            onClick={onEmail}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </button>
          <button
            onClick={onDownload}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Save
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}