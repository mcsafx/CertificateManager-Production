import React from "react";
import { SelectItem } from "@/components/ui/select";

interface SafeSelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectItem> {
  value: string;
  children: React.ReactNode;
}

/**
 * Um wrapper seguro para SelectItem que previne o erro de valor vazio
 * Esse componente garante que o SelectItem sempre terá um valor não vazio
 */
export const SafeSelectItem: React.FC<SafeSelectItemProps> = ({ value, children, ...props }) => {
  // Sempre use um valor de fallback se o valor estiver vazio
  const safeValue = value || "fallback_empty_value";
  
  return (
    <SelectItem value={safeValue} {...props}>
      {children}
    </SelectItem>
  );
};