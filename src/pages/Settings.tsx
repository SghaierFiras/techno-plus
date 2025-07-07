import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 md:px-8 min-w-0">
      <div className="mb-6">
        <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 p-6">
          <SettingsIcon className="h-12 w-12 text-yellow-600" />
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-lg text-muted-foreground mb-6 max-w-xl">
        The settings page is coming soon. You'll soon be able to customize your preferences, manage users, and configure system options. Stay tuned!
      </p>
      <div className="flex gap-4 justify-center">
        <button className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-gray-200 transition">Back to Dashboard</button>
      </div>
    </div>
  );
} 