import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Banknote, Calculator } from 'lucide-react';
import { PaymentMethod } from '../../types/pos';
import CustomerSelect from '../customers/CustomerSelect';

interface PaymentModalProps {
  total: number;
  onPayment: (payment: PaymentMethod, customerInfo: { id: string } | null) => void;
  onCancel: () => void;
  currency?: string;
}

export default function PaymentModal({ total, onPayment, onCancel, currency = 'CAD' }: PaymentModalProps) {
  const { t } = useTranslation();
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [cashAmount, setCashAmount] = useState(total);
  const [cardAmount, setCardAmount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isPassenger, setIsPassenger] = useState(true); // Default to Passenger

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const changeDue = paymentType === 'cash' ? Math.max(0, cashAmount - total) : 0;
  const totalPaid = paymentType === 'mixed' ? cashAmount + cardAmount : 
                   paymentType === 'cash' ? cashAmount : total;

  const isValidPayment = totalPaid >= total;

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    setIsPassenger(false);
  };
  const handlePassengerToggle = () => {
    setIsPassenger((prev) => {
      if (!prev) setSelectedCustomerId(null);
      return !prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPayment) return;

    const payment: PaymentMethod = {
      type: paymentType,
      amount: total,
      cash_amount: paymentType === 'cash' || paymentType === 'mixed' ? cashAmount : undefined,
      card_amount: paymentType === 'card' || paymentType === 'mixed' ? 
                   (paymentType === 'card' ? total : cardAmount) : undefined,
      change_due: changeDue
    };

    onPayment(payment, isPassenger || !selectedCustomerId ? null : { id: selectedCustomerId });
  };

  const quickCashAmounts = [
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= total);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Process Payment</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 min-w-0">
                <CustomerSelect
                  value={isPassenger ? undefined : selectedCustomerId || undefined}
                  onValueChange={handleCustomerSelect}
                  placeholder={t('customers.selectCustomer')}
                  disabled={isPassenger}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="passenger-toggle-modal"
                  type="checkbox"
                  checked={isPassenger}
                  onChange={handlePassengerToggle}
                  className="accent-blue-600 h-5 w-5"
                />
                <label htmlFor="passenger-toggle-modal" className="text-sm font-medium">
                  {t('common.passenger')}
                </label>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('cash');
                  setCashAmount(total);
                  setCardAmount(0);
                }}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 ${
                  paymentType === 'cash' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-xs font-medium">Cash</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setPaymentType('card');
                  setCashAmount(0);
                  setCardAmount(total);
                }}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 ${
                  paymentType === 'card' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs font-medium">Card</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setPaymentType('mixed');
                  setCashAmount(Math.floor(total / 2));
                  setCardAmount(total - Math.floor(total / 2));
                }}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-1 ${
                  paymentType === 'mixed' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Calculator className="h-6 w-6" />
                <span className="text-xs font-medium">Mixed</span>
              </button>
            </div>
          </div>

          {/* Cash Payment */}
          {(paymentType === 'cash' || paymentType === 'mixed') && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Cash Amount {paymentType === 'mixed' && '(Partial)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={paymentType === 'cash' || paymentType === 'mixed'}
              />
              
              {paymentType === 'cash' && quickCashAmounts.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {quickCashAmounts.slice(0, 4).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCashAmount(amount)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Card Payment */}
          {(paymentType === 'card' || paymentType === 'mixed') && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Card Amount {paymentType === 'mixed' && '(Partial)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentType === 'card' ? total : cardAmount}
                onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={paymentType === 'card'}
                required={paymentType === 'mixed'}
              />
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Required:</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Paid:</span>
              <span className={`font-medium ${totalPaid >= total ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalPaid)}
              </span>
            </div>
            {changeDue > 0 && (
              <div className="flex justify-between text-sm font-medium text-green-600">
                <span>Change Due:</span>
                <span>{formatCurrency(changeDue)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidPayment}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}