interface FitmentBadgeRowProps {
  fitRating: number;
  matchingDimCount: number;
}

export default function FitmentBadgeRow({ fitRating, matchingDimCount }: FitmentBadgeRowProps) {
  if (fitRating === 0 || matchingDimCount === 0) return null;

  const bgStyles = 
    fitRating >= 4 ? 'bg-green-100 text-green-800 border-green-200' :
    fitRating === 3 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
    'bg-bg-secondary text-foreground border-border';

  return (
    <div className="flex gap-2 items-center flex-wrap mt-2">
      <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${bgStyles}`}>
        Fit: {fitRating}/5 ({matchingDimCount} dims)
      </span>
    </div>
  );
}
