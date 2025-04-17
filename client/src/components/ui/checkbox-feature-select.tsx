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
  value: string; // ID da funcionalidade selecionada
  onValueChange: (value: string) => void;
}

export function CheckboxFeatureSelect({ value, onValueChange }: CheckboxFeatureSelectProps) {
  // Estado para expandir/colapsar os acordeões de módulos
  const [openModules, setOpenModules] = useState<string[]>([]);
  
  // Quando uma funcionalidade é selecionada, expande automaticamente o módulo pai
  useEffect(() => {
    if (value) {
      const feature = findFeatureById(value);
      if (feature && !openModules.includes(feature.moduleCode)) {
        setOpenModules(prev => [...prev, feature.moduleCode]);
      }
    }
  }, [value, openModules]);

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
                      checked={value === feature.id}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onValueChange(feature.id);
                        } else {
                          onValueChange('');
                        }
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