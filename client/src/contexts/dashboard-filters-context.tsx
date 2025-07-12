import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DashboardFilters {
  period: '7d' | '30d' | '90d' | '365d';
  categoryId?: string;
  subcategoryId?: string;
  supplierId?: string;
  status?: 'all' | 'approved' | 'pending';
  productBaseId?: string;
}

interface DashboardFiltersContextType {
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  getQueryParams: () => URLSearchParams;
}

const defaultFilters: DashboardFilters = {
  period: '365d',
  status: 'all'
};

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined);

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(defaultFilters);

  const setFilters = (newFilters: Partial<DashboardFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };

  const getQueryParams = () => {
    const params = new URLSearchParams();
    
    params.set('period', filters.period);
    
    if (filters.categoryId) {
      params.set('categoryId', filters.categoryId);
    }
    
    if (filters.subcategoryId) {
      params.set('subcategoryId', filters.subcategoryId);
    }
    
    if (filters.supplierId) {
      params.set('supplierId', filters.supplierId);
    }
    
    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    
    if (filters.productBaseId) {
      params.set('productBaseId', filters.productBaseId);
    }
    
    return params;
  };

  return (
    <DashboardFiltersContext.Provider 
      value={{
        filters,
        setFilters,
        resetFilters,
        getQueryParams
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFiltersContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFiltersProvider');
  }
  return context;
}