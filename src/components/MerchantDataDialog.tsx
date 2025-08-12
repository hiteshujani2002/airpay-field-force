import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Users } from 'lucide-react'

interface MerchantDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, leadAssignerId: string) => void;
  title: string;
  description: string;
  isReassign?: boolean;
}

const MerchantDataDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  title, 
  description, 
  isReassign = false 
}: MerchantDataDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedLeadAssigner, setSelectedLeadAssigner] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = () => {
    if (selectedFile && selectedLeadAssigner) {
      onSubmit(selectedFile, selectedLeadAssigner)
      // Reset form
      setSelectedFile(null)
      setSelectedLeadAssigner('')
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setSelectedLeadAssigner('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReassign ? <Users className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Lead Assigner</Label>
            <Select value={selectedLeadAssigner} onValueChange={setSelectedLeadAssigner}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lead Assigner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="550e8400-e29b-41d4-a716-446655440001">Lead Assigner 1</SelectItem>
                <SelectItem value="550e8400-e29b-41d4-a716-446655440002">Lead Assigner 2</SelectItem>
                <SelectItem value="550e8400-e29b-41d4-a716-446655440003">Lead Assigner 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              Required columns: Merchant Name, Merchant Phone Number, Merchant Address, City, State, Pincode
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || !selectedLeadAssigner}
              className="flex-1"
            >
              {isReassign ? <Users className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {isReassign ? 'Reassign' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MerchantDataDialog