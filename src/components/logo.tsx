
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyInfo } from '@/lib/storage';
import type { CompanyInfo } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';

interface LogoProps {
    className?: string;
    onLoginPage?: boolean;
}

function LogoInternal({ className }: { className?: string }) {
  const { state } = useSidebar();
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
    };

    fetchCompanyInfo();
  }, []);

  return (
    <div className={cn('flex items-center gap-3 text-primary transition-all duration-200 group-data-[collapsible=icon]/sidebar-wrapper:justify-center', className)}>
      {companyInfo?.logoUrl ? (
        <Image src={companyInfo.logoUrl} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain shrink-0" />
      ) : (
        <Wrench className="h-8 w-8 shrink-0" />
      )}
      <div className={cn("flex flex-col transition-opacity duration-200", state === 'collapsed' ? 'opacity-0' : 'opacity-100', 'md:group-data-[state=expanded]:opacity-100 md:group-data-[state=collapsed]:opacity-0')}>
        {companyInfo?.name && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">{companyInfo.name}</span>
        )}
      </div>
    </div>
  );
}


export function Logo({ className, onLoginPage = false }: LogoProps) {
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
    };

    fetchCompanyInfo();
  }, []);
  
  if (onLoginPage) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4 text-primary', className)}>
            {companyInfo?.logoUrl ? (
                <Image src={companyInfo.logoUrl} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain" />
            ) : (
                <Wrench className="h-16 w-16" />
            )}
             {companyInfo?.name && (
                <span className="text-3xl font-bold tracking-tight">{companyInfo.name}</span>
            )}
        </div>
    );
  }

  // Only call useSidebar when not on login page
  return <LogoInternal className={className} />;
}
