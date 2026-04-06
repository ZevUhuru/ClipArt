interface ImageGridProps {
  children: React.ReactNode;
  variant?: "clipart" | "coloring" | "illustration" | "animations";
  className?: string;
}

const GRID_CLASSES: Record<string, string> = {
  clipart: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4",
  coloring: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4",
  illustration: "columns-2 gap-2.5 sm:columns-3 md:columns-4 [&>*]:mb-2.5 [&>*]:break-inside-avoid",
  animations: "columns-2 gap-2.5 sm:columns-3 md:columns-4 [&>*]:mb-2.5 [&>*]:break-inside-avoid",
};

export function ImageGrid({ children, variant = "clipart", className = "" }: ImageGridProps) {
  return (
    <div className={`${GRID_CLASSES[variant]} ${className}`}>
      {children}
    </div>
  );
}
