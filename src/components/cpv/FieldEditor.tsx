
import React from "react";
import { Eye, EyeOff, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CustomField {
  id: string;
  title: string;
  dataType: "alphabets" | "numbers" | "alphanumeric";
  mandatory: boolean;
  visible: boolean;
  type: "text" | "image";
  numberOfClicks?: number;
  documentName?: string;
}

interface FieldEditorProps {
  field: CustomField;
  onUpdate: (field: CustomField) => void;
  onToggleVisibility: (fieldId: string) => void;
  onRemove: (fieldId: string) => void;
  canRemove?: boolean;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({ 
  field, 
  onUpdate, 
  onToggleVisibility, 
  onRemove,
  canRemove = true 
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleDataTypeChange = (newDataType: "alphabets" | "numbers" | "alphanumeric") => {
    onUpdate({ ...field, dataType: newDataType });
  };

  const handleMandatoryChange = (mandatory: boolean) => {
    onUpdate({ ...field, mandatory });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{field.title}</span>
          {field.mandatory && <span className="text-red-500 text-sm">*</span>}
          {field.type === "image" && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Image ({field.numberOfClicks} clicks)
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Type: {field.dataType} | {field.visible ? 'Visible' : 'Hidden'}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Edit Field: {field.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data Type</Label>
                <Select value={field.dataType} onValueChange={handleDataTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md z-50">
                    <SelectItem value="alphabets">Alphabets</SelectItem>
                    <SelectItem value="numbers">Numbers</SelectItem>
                    <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`mandatory-${field.id}`}
                  checked={field.mandatory}
                  onCheckedChange={handleMandatoryChange}
                />
                <Label htmlFor={`mandatory-${field.id}`}>Mandatory field</Label>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setIsEditDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(field.id)}
        >
          {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
