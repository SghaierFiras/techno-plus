import React from 'react';
import { Product } from '../../types/inventory';
import { UnifiedTable } from '../common/UnifiedTable';
import { Eye, Edit, Trash2, Copy } from 'lucide-react';

function CopiableCode({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  const short = value.length > 10 ? value.slice(0, 10) + '...' : value;
  return (
    <button
      className="inline-flex items-center gap-1 group text-xs font-mono px-1 py-0.5 rounded hover:bg-black-600 active:bg-black-600 border border-transparent hover:border-black-600 transition cursor-pointer"
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

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
  loading?: boolean;
}

export default function ProductList({ products, onEdit, onDelete, onView, loading }: ProductListProps) {
  const columns = [
    {
      key: 'image',
      label: '',
      render: (p: Product) => (
        p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded shadow border" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border text-gray-400 text-xs">N/A</div>
        )
      ),
      className: 'w-[48px] text-center',
    },
    { key: 'name', label: 'Name' },
    { key: 'product_code', label: 'Code', render: (p: Product) => <CopiableCode value={p.product_code} /> },
    { key: 'barcode', label: 'Barcode', render: (p: Product) => <CopiableCode value={p.barcode || ''} /> },
    { key: 'category', label: 'Category', render: (p: Product) => p.category?.name || '-' },
    { key: 'supplier', label: 'Supplier', render: (p: Product) => p.supplier_info?.name || p.supplier || '-' },
    { key: 'quantity_in_stock', label: 'Stock' },
    { key: 'selling_price', label: 'Price', render: (p: Product) => `$${Number(p.selling_price || 0).toFixed(2)}` },
    { key: 'min_stock_level', label: 'Min Stock' },
    { key: 'is_active', label: 'Active', render: (p: Product) => p.is_active ? 'Yes' : 'No' },
  ];

  return (
    <UnifiedTable
      columns={columns}
      data={products}
      loading={loading}
      emptyMessage="No products found."
      rowKey={p => p.id}
      actions={product => (
        <div className="flex items-center justify-end space-x-2">
          <button onClick={() => onView(product)} className="text-blue-600 hover:text-blue-900" title="View">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit(product)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  );
}