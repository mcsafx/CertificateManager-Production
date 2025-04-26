import React, { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CatalogFeature, ModuleInfo, MODULES, getFeaturesByModule, findFeatureById } from "@/lib/feature-catalog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info, Check } from "lucide-react";

interface MultiCheckboxFeatureSelectProps {
  values: string[]; // IDs das funcionalidades selecionadas
  onValuesChange: (values: string[]) => void;
  moduleId?: number; // Opcional: se fornecido, filtra as funcionalidades pelo módulo
}

export function MultiCheckboxFeatureSelect({ 
  values, 
  onValuesChange,
  moduleId
}: MultiCheckboxFeatureSelectProps) {
  // Estado para expandir/colapsar os acordeões de módulos
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [selectedModuleCode, setSelectedModuleCode] = useState<string | null>(null);
  
  // Quando o moduleId é alterado, atualiza o módulo selecionado
  useEffect(() => {
    if (moduleId) {
      // Aqui você precisaria de uma função para obter o código do módulo pelo ID
      // Como não temos facilmente, vamos manter isso como um TODO
      // setSelectedModuleCode(findModuleCodeById(moduleId));
    }
  }, [moduleId]);
  
  // Quando uma funcionalidade é selecionada, expande automaticamente o módulo pai
  useEffect(() => {
    if (values.length > 0) {
      const newOpenModules = new Set<string>(openModules);
      
      values.forEach(featureId => {
        const feature = findFeatureById(featureId);
        if (feature && !openModules.includes(feature.moduleCode)) {
          newOpenModules.add(feature.moduleCode);
        }
      });
      
      if (newOpenModules.size !== openModules.length) {
        setOpenModules(Array.from(newOpenModules));
      }
    }
  }, [values, openModules]);

  // Manipula a alteração no acordeão
  const handleAccordionChange = (moduleCode: string) => {
    setOpenModules(prev => 
      prev.includes(moduleCode) 
        ? prev.filter(mod => mod !== moduleCode) 
        : [...prev, moduleCode]
    );
  };
  
  // Seleciona ou deseleciona todas as funcionalidades de um módulo
  const handleSelectAllModule = (moduleCode: string) => {
    const moduleFeaturesIds = getFeaturesByModule(moduleCode).map(f => f.id);
    
    // Verificar se todas as funcionalidades do módulo já estão selecionadas
    const allSelected = moduleFeaturesIds.every(id => values.includes(id));
    
    if (allSelected) {
      // Desmarcar todas as funcionalidades do módulo
      onValuesChange(values.filter(id => !moduleFeaturesIds.includes(id)));
    } else {
      // Marcar todas as funcionalidades do módulo que ainda não estão marcadas
      const newValues = [...values];
      moduleFeaturesIds.forEach(id => {
        if (!newValues.includes(id)) {
          newValues.push(id);
        }
      });
      onValuesChange(newValues);
    }
  };

  // Manipula a alteração de estado de uma funcionalidade
  const handleFeatureChange = (featureId: string, checked: boolean) => {
    if (checked && !values.includes(featureId)) {
      onValuesChange([...values, featureId]);
    } else if (!checked && values.includes(featureId)) {
      onValuesChange(values.filter(id => id !== featureId));
    }
  };
  
  // Filtra os módulos a serem exibidos
  const modulesToShow = selectedModuleCode 
    ? MODULES.filter(m => m.code === selectedModuleCode)
    : MODULES;

  return (
    <ScrollArea className="h-[400px] pr-4">
      <Accordion
        type="multiple"
        value={openModules}
        onValueChange={setOpenModules}
        className="w-full"
      >
        {modulesToShow.map(module => {
          const moduleFeatures = getFeaturesByModule(module.code);
          const selectedCount = moduleFeatures.filter(f => values.includes(f.id)).length;
          const allSelected = selectedCount === moduleFeatures.length && moduleFeatures.length > 0;
          
          return (
            <AccordionItem key={module.code} value={module.code}>
              <div className="flex items-center gap-2 mb-1 justify-between">
                <div className="flex items-center">
                  <Checkbox
                    id={`multi-module-${module.code}`}
                    checked={allSelected}
                    onCheckedChange={() => handleSelectAllModule(module.code)}
                    className="mr-1"
                  />
                  <Label 
                    htmlFor={`multi-module-${module.code}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                  </Label>
                </div>
                <Badge variant="outline">
                  {selectedCount}/{moduleFeatures.length}
                </Badge>
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
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-2 pt-2">
                  {moduleFeatures.map(feature => (
                    <div key={feature.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`multi-${feature.id}`}
                        checked={values.includes(feature.id)}
                        onCheckedChange={(checked) => {
                          handleFeatureChange(feature.id, checked === true);
                        }}
                      />
                      <div className="w-full">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={`multi-${feature.id}`}
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
          );
        })}
      </Accordion>
    </ScrollArea>
  );
}