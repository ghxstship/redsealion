import { useEffect, useState } from 'react';
import { useFitment } from '@/hooks/useFitment';
import Button from '@/components/ui/Button';

interface FitmentDimension {
  id: string;
  dimension_type: string;
  dimension_value: string;
  display_label: string;
}

interface FitmentFilterPanelProps {
  collectionCode?: string;
  initialFilters?: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function FitmentFilterPanel({ collectionCode, initialFilters, onFilterChange }: FitmentFilterPanelProps) {
  const { getFitmentDimensions, loading } = useFitment();
  const [dimensions, setDimensions] = useState<FitmentDimension[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(initialFilters || {});
  
  useEffect(() => {
    let mounted = true;
    getFitmentDimensions(collectionCode).then(dims => {
      if (mounted) setDimensions(dims);
    }).catch(console.error);
    return () => { mounted = false; };
  }, [collectionCode, getFitmentDimensions]);

  const handleSelect = (dimType: string, dimVal: string) => {
    const next = { ...selectedFilters, [dimType]: dimVal };
    if (!dimVal) delete next[dimType];
    setSelectedFilters(next);
  };

  const handleApply = () => {
    onFilterChange(selectedFilters);
  };

  const handleClear = () => {
    setSelectedFilters({});
    onFilterChange({});
  };

  if (loading) {
    return <div className="animate-pulse space-y-4 p-4"><div className="h-4 bg-bg-secondary w-full rounded"></div></div>;
  }

  // Group by dimension type
  const grouped = dimensions.reduce<Record<string, FitmentDimension[]>>((acc, dim) => {
    if (!acc[dim.dimension_type]) acc[dim.dimension_type] = [];
    acc[dim.dimension_type].push(dim);
    return acc;
  }, {});

  return (
    <div className="bg-bg-secondary p-4 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Fitment Intelligence</h3>
        <button onClick={handleClear} className="text-xs text-blue-600 hover:text-blue-500">Clear</button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([type, dims]: [string, FitmentDimension[]]) => (
          <div key={type}>
            <label className="block text-xs font-medium text-text-secondary capitalize mb-1">
              {type.replace('_', ' ')}
            </label>
            <select
              value={selectedFilters[type] || ''}
              onChange={(e) => handleSelect(type, e.target.value)}
              className="w-full text-sm rounded bg-background border-border"
            >
              <option value="">Any</option>
              {dims.map((d: FitmentDimension) => (
                <option key={d.id} value={d.dimension_value}>{d.display_label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <Button onClick={handleApply} className="w-full mt-4" variant="primary">
        Apply Fitment
      </Button>
    </div>
  );
}
