import Link from 'next/link';
import { ReactNode } from 'react';

interface DashboardHeaderProps {
  title: string;
  description: string;
  icon?: string;
  backUrl?: string;
  backText?: string;
  actions?: ReactNode;
  statusBadge?: ReactNode;
  adminInfo?: string;
}

export default function DashboardHeader({
  title,
  description,
  icon = "",
  backUrl = "/admin-dashboard",
  backText = "← Back to Dashboard",
  actions,
  statusBadge,
  adminInfo
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{icon} {title}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {statusBadge}
            <Link href={backUrl}>
              <button className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors">
                {backText}
              </button>
            </Link>
            {actions}
          </div>
        </div>
        
        {adminInfo && (
          <div className="text-xs text-gray-600">
            {adminInfo}
          </div>
        )}
      </div>
    </div>
  );
}