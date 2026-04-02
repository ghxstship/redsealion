'use client';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export default function ChartContainer({
  title,
  children,
  height = 300,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div style={{ height }} className="relative">
        {children}
      </div>
    </div>
  );
}
