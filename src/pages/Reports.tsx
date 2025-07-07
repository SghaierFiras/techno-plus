import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 md:px-8 min-w-0">
      <div className="mb-6">
        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-6">
          <BarChart3 className="h-12 w-12 text-blue-600" />
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
      <p className="text-lg text-muted-foreground mb-6 max-w-xl">
        Powerful reporting features are coming soon. You'll be able to view sales, inventory, and customer analytics in beautiful, exportable formats. Stay tuned!
      </p>
      <div className="flex gap-4">
        <button className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-gray-200 transition">Back to Dashboard</button>
      </div>
    </div>
  );
} 