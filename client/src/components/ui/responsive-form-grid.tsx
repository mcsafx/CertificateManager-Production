import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveFormGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    widescreen?: number;
  };
}

export function ResponsiveFormGrid({ 
  children, 
  className,
  columns = {
    mobile: 1,
    tablet: 1,
    desktop: 2,
    widescreen: 3
  }
}: ResponsiveFormGridProps) {
  // Build the grid class names dynamically
  const gridClasses = [
    "grid",
    "gap-4",
    "gap-y-4",
    "sm:gap-6"
  ];

  // Add mobile grid columns
  if (columns.mobile === 1) gridClasses.push("grid-cols-1");
  if (columns.mobile === 2) gridClasses.push("grid-cols-2");
  if (columns.mobile === 3) gridClasses.push("grid-cols-3");

  // Add tablet grid columns
  if (columns.tablet === 1) gridClasses.push("md:grid-cols-1");
  if (columns.tablet === 2) gridClasses.push("md:grid-cols-2");
  if (columns.tablet === 3) gridClasses.push("md:grid-cols-3");

  // Add desktop grid columns
  if (columns.desktop === 1) gridClasses.push("lg:grid-cols-1");
  if (columns.desktop === 2) gridClasses.push("lg:grid-cols-2");
  if (columns.desktop === 3) gridClasses.push("lg:grid-cols-3");

  // Add widescreen grid columns
  if (columns.widescreen === 1) gridClasses.push("xl:grid-cols-1");
  if (columns.widescreen === 2) gridClasses.push("xl:grid-cols-2");
  if (columns.widescreen === 3) gridClasses.push("xl:grid-cols-3");
  if (columns.widescreen === 4) gridClasses.push("xl:grid-cols-4");

  return (
    <div className={cn(gridClasses.join(" "), className)}>
      {children}
    </div>
  );
}

interface ResponsiveFormSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function ResponsiveFormSection({ 
  children, 
  className,
  title,
  description
}: ResponsiveFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface ResponsiveDialogProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function ResponsiveDialog({ 
  children, 
  className,
  size = "md"
}: ResponsiveDialogProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg xl:max-w-2xl",
    xl: "max-w-xl xl:max-w-4xl",
    "2xl": "max-w-2xl xl:max-w-6xl",
    full: "max-w-[95vw] xl:max-w-[85vw]"
  };

  return (
    <div className={cn(
      "w-full",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}