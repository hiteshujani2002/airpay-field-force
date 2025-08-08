
import React from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePlaceholderProps {
  documentName: string;
  imageIndex: number;
  totalImages: number;
  onRemove?: () => void;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  documentName,
  imageIndex,
  totalImages,
  onRemove
}) => {
  return (
    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-600 font-medium">
        {documentName}
      </p>
      {totalImages > 1 && (
        <p className="text-xs text-gray-500 mt-1">
          Image {imageIndex + 1} of {totalImages}
        </p>
      )}
      
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          // Handle file upload logic here
          console.log('File selected:', e.target.files?.[0]);
        }}
      />
    </div>
  );
};
