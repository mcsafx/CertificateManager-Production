import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Search,
  SlidersHorizontal,
  Download,
  Save
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterState {
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string[];
  plans: string[];
  modules: string[];
  customFilters: { [key: string]: any };
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableOptions?: {
    plans?: { id: string; name: string }[];
    modules?: { id: string; name: string }[];
    statuses?: { id: string; name: string }[];
  };
  savedFilters?: { id: string; name: string; filters: FilterState }[];
}

export function AdvancedFilters({ onFiltersChange, availableOptions, savedFilters }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    dateRange: { from: undefined, to: undefined },
    status: [],
    plans: [],
    modules: [],
    customFilters: {}
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    const cleared: FilterState = {
      search: "",
      dateRange: { from: undefined, to: undefined },
      status: [],
      plans: [],
      modules: [],
      customFilters: {}
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.status.length > 0) count++;
    if (filters.plans.length > 0) count++;
    if (filters.modules.length > 0) count++;
    return count;
  };

  const toggleArrayFilter = (key: keyof Pick<FilterState, 'status' | 'plans' | 'modules'>, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Filtros Avançados</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} filtro(s) ativo(s)
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? 'Ocultar' : 'Expandir'}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search - Always Visible */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Busca Geral</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar em todos os campos..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <>
            {/* Date Range Filter */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => updateFilters({ 
                        dateRange: { ...filters.dateRange, from: date } 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => updateFilters({ 
                        dateRange: { ...filters.dateRange, to: date } 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Multi-Select Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status Filter */}
              {availableOptions?.statuses && (
                <div>
                  <Label>Status</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {availableOptions.statuses.map((status) => (
                      <div key={status.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.id}`}
                          checked={filters.status.includes(status.id)}
                          onCheckedChange={() => toggleArrayFilter('status', status.id)}
                        />
                        <Label htmlFor={`status-${status.id}`} className="text-sm">
                          {status.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plans Filter */}
              {availableOptions?.plans && (
                <div>
                  <Label>Planos</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {availableOptions.plans.map((plan) => (
                      <div key={plan.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`plan-${plan.id}`}
                          checked={filters.plans.includes(plan.id)}
                          onCheckedChange={() => toggleArrayFilter('plans', plan.id)}
                        />
                        <Label htmlFor={`plan-${plan.id}`} className="text-sm">
                          {plan.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules Filter */}
              {availableOptions?.modules && (
                <div>
                  <Label>Módulos</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {availableOptions.modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`module-${module.id}`}
                          checked={filters.modules.includes(module.id)}
                          onCheckedChange={() => toggleArrayFilter('modules', module.id)}
                        />
                        <Label htmlFor={`module-${module.id}`} className="text-sm">
                          {module.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Saved Filters */}
            {savedFilters && savedFilters.length > 0 && (
              <div>
                <Label>Filtros Salvos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedFilters.map((savedFilter) => (
                    <Button
                      key={savedFilter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters(savedFilter.filters);
                        onFiltersChange(savedFilter.filters);
                      }}
                    >
                      {savedFilter.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Filtro
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resultados
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {getActiveFiltersCount()} filtro(s) aplicado(s)
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}