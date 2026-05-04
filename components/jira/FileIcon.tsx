import React from 'react';
import { getFileMetadata } from '../../utils/fileMetadata';

interface FileIconProps {
  fileName: string;
  className?: string;
  showLabel?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  className = 'w-5 h-5',
  showLabel = false,
}) => {
  const { icon: Icon, color, label } = getFileMetadata(fileName);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} title={label}>
      <Icon className={`w-full h-full ${color}`} />
      {showLabel && <span className="text-xs text-base-content/70 truncate">{fileName}</span>}
    </div>
  );
};
