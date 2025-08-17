import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface MerchantUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, leadAssignerId: string) => void;
  formName?: string;
}

const MerchantUploadDialog = ({ open, onOpenChange, onUpload, formName }: MerchantUploadDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedLeadAssigner, setSelectedLeadAssigner] = useState<string>('')
  const [leadAssigners, setLeadAssigners] = useState<any[]>([])
  const [loadingLeadAssigners, setLoadingLeadAssigners] = useState(false)

  useEffect(() => {
    if (open && user) {
      loadLeadAssigners()
    }
  }, [open, user])

  const loadLeadAssigners = async () => {
    if (!user) return;
    
    setLoadingLeadAssigners(true)
    try {
      // Get current user's company first
      const { data: currentUserData, error: userError } = await supabase
        .from('user_roles')
        .select('company')
        .eq('user_id', user.id)
        .single()

      if (userError) throw userError

      // Fetch lead assigners from the same company
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, username, email, company')
        .eq('role', 'lead_assigner')
        .eq('company', currentUserData.company)
        .order('username', { ascending: true })

      if (error) throw error

      setLeadAssigners(data || [])
    } catch (error: any) {
      console.error('Error loading lead assigners:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lead assigners',
        variant: 'destructive',
      })
    } finally {
      setLoadingLeadAssigners(false)
    }
  }

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
              Required columns: Merchant Name, Merchant Phone Number, Merchant Address, City, State, Pincode
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign Lead Assigner</Label>
            <Select value={selectedLeadAssigner} onValueChange={setSelectedLeadAssigner}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lead Assigner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned (Will be assigned later)</SelectItem>
                {leadAssigners.map((assigner) => (
                  <SelectItem key={assigner.user_id} value={assigner.user_id}>
                    {assigner.username} ({assigner.email})
                  </SelectItem>
                ))}
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