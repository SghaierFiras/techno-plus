import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function RecentTransactionsCard() {
  const { t } = useTranslation();
  const { transactions, loading } = useTransactions();

  const recent = transactions.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentSales')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center">{t('transactions.loading')}</div>
        ) : recent.length === 0 ? (
          <div className="py-8 text-center">{t('transactions.empty')}</div>
        ) : (
          <ul className="divide-y">
            {recent.map(tx => (
              <li key={tx.id} className="py-2 flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-0">
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="text-sm min-w-[90px]">{new Date(tx.created_at).toLocaleDateString()}</span>
                  <span className="font-medium min-w-[80px]">
                    ${Number(tx.total || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground min-w-[80px]">{tx.paymentMethod || '-'}</span>
                  <span className="text-xs text-muted-foreground min-w-[60px]">{tx.discount_amount ? (tx.discountType === 'percent' ? `${tx.discount_amount}%` : `$${tx.discount_amount}`) : '-'}</span>
                  <span className="text-xs">{tx.items.map(i => i.name).join(', ')}</span>
                </div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  {tx.customerId == null ? t('common.passenger') : (tx.customerName || '-')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 