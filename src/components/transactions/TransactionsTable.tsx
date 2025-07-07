import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UnifiedTable } from '../common/UnifiedTable';
import { Eye, Copy } from 'lucide-react';
import { Transaction } from '../../types/transactions';

function CopiableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const short = value.length > 10 ? value.slice(0, 10) + '...' : value;
  return (
    <button
      className="inline-flex items-center gap-1 group text-xs font-mono px-1 py-0.5 rounded hover:bg-black-600 active:bg-black-600 border border-transparent hover:border-primary transition cursor-pointer"
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

export default function TransactionsTable() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({});
  const { transactions, loading } = useTransactions(filters);

  const columns = [
    { key: 'id', label: t('transactions.id'), render: (tx: Transaction) => <CopiableId value={tx.id} /> },
    { key: 'customer', label: t('transactions.customer'), render: (tx: Transaction) => tx.customerId == null ? t('common.passenger') : (tx.customerName || '-') },
    { key: 'items', label: t('transactions.items'), render: (tx: Transaction) => <><Badge>{tx.items.length}</Badge><span className="ml-2">{tx.items.map(i => i.name).join(', ')}</span></> },
    { key: 'total', label: t('transactions.total'), render: (tx: Transaction) => `$${Number(tx.total || 0).toFixed(2)}` },
    { key: 'discount', label: t('transactions.discount'), render: (tx: Transaction) => tx.discount_amount ? (tx.discountType === 'percent' ? `${tx.discount_amount}%` : `$${tx.discount_amount}`) : '-' },
    { key: 'payment', label: t('transactions.payment'), render: (tx: Transaction) => tx.paymentMethod || '-' },
    { key: 'date', label: t('transactions.date'), render: (tx: Transaction) => new Date(tx.created_at).toLocaleDateString() },
  ];

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">{t('transactions.title')}</h2>
      <div className="flex gap-2 mb-4">
        <Input placeholder={t('transactions.searchCustomer')} onChange={e => setFilters(f => ({ ...f, customerId: e.target.value }))} />
      </div>
      <UnifiedTable
        columns={columns}
        data={transactions}
        loading={loading}
        emptyMessage={t('transactions.empty')}
        rowKey={tx => tx.id}
        actions={tx => (
          <button className="text-blue-600 hover:text-blue-900" title={t('common.view')} onClick={() => console.log('View transaction', tx)}>
            <Eye className="h-4 w-4" />
          </button>
        )}
      />
    </div>
  );
} 