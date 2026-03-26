interface ImageGridProps {
  children: React.ReactNode;
  variant?: "clipart" | "coloring";
  className?: string;
}

const GRID_CLASSES: Record<string, string> = {
  clipart: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
  coloring: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
};

export function ImageGrid({ children, variant = "clipart", className = "" }: ImageGridProps) {
  return (
    <div className={`${GRID_CLASSES[variant]} ${className}`}>
      {children}
    </div>
  );
}
