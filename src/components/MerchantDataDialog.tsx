import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

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
                 {!isReassign && <SelectItem value="unassigned">Unassigned (Will be assigned later)</SelectItem>}
                 {leadAssigners.map((assigner) => (
                   <SelectItem key={assigner.user_id} value={assigner.user_id}>
                     {assigner.username} ({assigner.email})
                   </SelectItem>
                 ))}
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