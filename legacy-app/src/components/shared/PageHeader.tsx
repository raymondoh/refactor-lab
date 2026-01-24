// src/components/shared/PageHeader.tsx
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">{title}</h1>
      <div className="w-12 h-0.5 bg-primary mb-6"></div>
      <p className="text-muted-foreground text-center max-w-3xl text-lg">{subtitle}</p>
    </div>
  );
}
