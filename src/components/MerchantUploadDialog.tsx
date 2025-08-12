import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'

interface MerchantUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, leadAssignerId: string) => void;
  formName?: string;
}

const MerchantUploadDialog = ({ open, onOpenChange, onUpload, formName }: MerchantUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedLeadAssigner, setSelectedLeadAssigner] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile && selectedLeadAssigner) {
      onUpload(selectedFile, selectedLeadAssigner)
      // Reset form
      setSelectedFile(null)
      setSelectedLeadAssigner('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Merchants & Assign</DialogTitle>
          <DialogDescription>
            Upload merchant data for {formName} and assign to a Lead Assigner
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="merchant-file">Upload Merchant Excel File</Label>
            <Input 
              id="merchant-file" 
              type="file" 
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              Required columns: Merchant Name, Merchant Phone Number, Merchant Address, City, State, Pincode, CPV Agent
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign Lead Assigner</Label>
            <Select value={selectedLeadAssigner} onValueChange={setSelectedLeadAssigner}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lead Assigner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead1">Lead Assigner 1</SelectItem>
                <SelectItem value="lead2">Lead Assigner 2</SelectItem>
                <SelectItem value="lead3">Lead Assigner 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedLeadAssigner}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MerchantUploadDialog