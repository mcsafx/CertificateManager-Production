import React, { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CatalogFeature, ModuleInfo, MODULES, getFeaturesByModule, findFeatureById } from "@/lib/feature-catalog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CheckboxFeatureSelectProps {
  value: string[]; // Lista de IDs das funcionalidades selecionadas
  onValueChange: (value: string[]) => void;
}

export function CheckboxFeatureSelect({ value, onValueChange }: CheckboxFeatureSelectProps) {
  // Estado para expandir/colapsar os acordeões de módulos
  const [openModules, setOpenModules] = useState<string[]>([]);
  
  // Quando uma funcionalidade é selecionada, expande automaticamente o módulo pai
  useEffect(() => {
    if (value && value.length > 0) {
      const selectedModules = value.map(featureId => {
        const feature = findFeatureById(featureId);
        return feature?.moduleCode || '';
      }).filter(moduleCode => moduleCode && !openModules.includes(moduleCode));
      
      if (selectedModules.length > 0) {
        setOpenModules(prev => [...prev, ...selectedModules]);
      }
    }
  }, [value, openModules]);

  // Função para verificar se uma funcionalidade está selecionada
  const isFeatureSelected = (featureId: string) => {
    return value.includes(featureId);
  };
  
  // Função para lidar com a seleção/deseleção de funcionalidades
  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      // Adicionar à lista de selecionados
      onValueChange([...value, featureId]);
    } else {
      // Remover da lista de selecionados
      onValueChange(value.filter(id => id !== featureId));
    }
  };
  
  // Função para selecionar/desselecionar todas as funcionalidades de um módulo
  const handleToggleAllModuleFeatures = (moduleCode: string, checked: boolean) => {
    const moduleFeatures = getFeaturesByModule(moduleCode);
    const moduleFeatureIds = moduleFeatures.map(f => f.id);
    
    if (checked) {
      // Selecionar todas as funcionalidades do módulo que ainda não estão selecionadas
      const newSelectedIds = [...value];
      moduleFeatureIds.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });
      onValueChange(newSelectedIds);
    } else {
      // Remover todas as funcionalidades do módulo
      onValueChange(value.filter(id => !moduleFeatureIds.includes(id)));
    }
  };
  
  // Função para verificar se todas as funcionalidades de um módulo estão selecionadas
  const areAllModuleFeaturesSelected = (moduleCode: string) => {
    const moduleFeatures = getFeaturesByModule(moduleCode);
    return moduleFeatures.length > 0 && moduleFeatures.every(feature => isFeatureSelected(feature.id));
  };
  
  // Função para verificar se algumas (mas não todas) as funcionalidades de um módulo estão selecionadas
  const areSomeModuleFeaturesSelected = (moduleCode: string) => {
    const moduleFeatures = getFeaturesByModule(moduleCode);
    return moduleFeatures.some(feature => isFeatureSelected(feature.id)) && 
           !moduleFeatures.every(feature => isFeatureSelected(feature.id));
  };

  // Manipula a alteração no acordeão
  const handleAccordionChange = (moduleCode: string) => {
    setOpenModules(prev => 
      prev.includes(moduleCode) 
        ? prev.filter(mod => mod !== moduleCode) 
        : [...prev, moduleCode]
    );
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <Accordion
        type="multiple"
        value={openModules}
        onValueChange={setOpenModules}
        className="w-full"
      >
        {MODULES.map(module => (
          <AccordionItem key={module.code} value={module.code}>
            <div className="flex items-center gap-2 mb-1">
              <Checkbox
                id={`module-${module.code}`}
                checked={areAllModuleFeaturesSelected(module.code)}
                onCheckedChange={(checked) => {
                  handleToggleAllModuleFeatures(module.code, checked === true);
                }}
                className="mr-1"
                data-state={
                  areSomeModuleFeaturesSelected(module.code) 
                    ? "indeterminate" 
                    : (areAllModuleFeaturesSelected(module.code) ? "checked" : "unchecked")
                }
              />
              <Label 
                htmlFor={`module-${module.code}`}
                className="text-sm font-medium cursor-pointer"
              >
                Selecionar todas
              </Label>
            </div>
            
            <AccordionTrigger 
              onClick={(e) => {
                e.preventDefault();
                handleAccordionChange(module.code);
              }}
              className="hover:no-underline"
            >
              <div className="flex items-center gap-2">
                <span>{module.name}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{module.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="outline" className="ml-2">
                  {getFeaturesByModule(module.code).length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-2 pt-2">
                {getFeaturesByModule(module.code).map(feature => (
                  <div key={feature.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={feature.id}
                      checked={isFeatureSelected(feature.id)}
                      onCheckedChange={(checked) => {
                        handleFeatureToggle(feature.id, checked === true);
                      }}
                    />
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <Label 
                          htmlFor={feature.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {feature.name}
                        </Label>
                        <code className="text-xs text-muted-foreground">
                          {feature.path}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}