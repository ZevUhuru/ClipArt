import React from 'react';
import Image from 'next/image';

interface ProtectedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  width = 500,
  height = 500,
  className = '',
  priority = false,
  unoptimized = false,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="relative select-none"
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} pointer-events-none`}
        priority={priority}
        unoptimized={unoptimized}
        draggable={false}
      />
      {/* Invisible overlay to prevent clicks */}
      <div 
        className="absolute inset-0 cursor-default"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
    </div>
  );
};

export default ProtectedImage;

