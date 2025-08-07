import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, Building2, Users, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

type EntityType = 'company' | 'agency' | null
type OnboardingStep = 'selection' | 'details' | 'documents' | 'complete'

const companyDetailsSchema = z.object({
  companyName: z.string().regex(/^[A-Za-z\s]+$/, 'Only alphabetic characters allowed'),
  businessDescription: z.string().regex(/^[A-Za-z\s]+$/, 'Only alphabetic characters allowed'),
  companyType: z.string().min(1, 'Please select a company type'),
  spocMail: z.string().email('Invalid email format'),
  spocContact: z.string().regex(/^\d+$/, 'Only numeric values allowed'),
  spocUsername: z.string().regex(/^[A-Za-z]+$/, 'Only alphabetic characters allowed'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  country: z.string().min(1, 'Please select a country'),
  state: z.string().min(1, 'Please select a state'),
  city: z.string().min(1, 'Please select a city'),
  pincode: z.string().regex(/^\d+$/, 'Only numeric values allowed'),
  initiative: z.string().min(1, 'Initiative is required'),
  officeOwnership: z.string().min(1, 'Please select office ownership')
})

const agencyDetailsSchema = companyDetailsSchema.omit({ initiative: true }).extend({
  mapWith: z.array(z.string()).min(1, 'Please select at least one company to map with')
})

const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia']
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
]

const cityMap: { [key: string]: string[] } = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Ziro', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'],
  'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Rangpo'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Rudrapur', 'Kashipur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua'],
  'Ladakh': ['Leh', 'Kargil', 'Nubra', 'Zanskar', 'Changthang']
}

const mockCompanies = [
  'Tech Solutions Ltd', 'Digital Innovations Inc', 'Global Services Corp',
  'Smart Systems Pvt Ltd', 'Future Technologies', 'Enterprise Solutions'
]

export default function EntityOnboarding() {
  const [entityType, setEntityType] = useState<EntityType>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('selection')
  const [selectedState, setSelectedState] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const companyForm = useForm({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      companyName: '',
      businessDescription: '',
      companyType: '',
      spocMail: '',
      spocContact: '',
      spocUsername: '',
      addressLine1: '',
      addressLine2: '',
      country: '',
      state: '',
      city: '',
      pincode: '',
      initiative: '',
      officeOwnership: ''
    }
  })

  const agencyForm = useForm({
    resolver: zodResolver(agencyDetailsSchema),
    defaultValues: {
      companyName: '',
      businessDescription: '',
      companyType: '',
      spocMail: '',
      spocContact: '',
      spocUsername: '',
      addressLine1: '',
      addressLine2: '',
      country: '',
      state: '',
      city: '',
      pincode: '',
      officeOwnership: '',
      mapWith: []
    }
  })

  const handleEntitySelection = (type: EntityType) => {
    setEntityType(type)
    setCurrentStep('details')
  }

  const handleDetailsSubmit = (data: any) => {
    console.log('Details submitted:', data)
    setCurrentStep('documents')
  }

  const handleFileDelete = (indexToDelete: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToDelete))
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const currentForm = entityType === 'company' ? companyForm : agencyForm
      const formData = currentForm.getValues()
      
      // Map form data to database schema
      const entityData: any = {
        entity_type: entityType,
        user_id: null, // Allow anonymous access
        // Common fields
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        office_ownership: formData.officeOwnership === 'rented' ? 'rented' : 
                          formData.officeOwnership === 'owned' ? 'owned' : 'shared',
        documents: uploadedFiles.map(file => ({ name: file.name, size: file.size })),
      }

      // Entity-specific fields
      if (entityType === 'company') {
        entityData.company_name = formData.companyName
        entityData.company_type = formData.companyType === 'pvt' ? 'private_limited' :
                                  formData.companyType === 'llp' ? 'llp' :
                                  formData.companyType === 'proprietor' ? 'sole_proprietorship' :
                                  'private_limited'
      } else {
        entityData.agency_name = formData.companyName
        const agencyFormData = formData as any
        entityData.parent_company = agencyFormData.mapWith?.[0] || null
      }

      const { data, error } = await supabase
        .from('entities')
        .insert([entityData])
        .select()

      if (error) throw error

      const successMessage = entityType === 'company' 
        ? 'Client admin created; company successfully onboarded'
        : 'Lead Assigner user created, agency onboarded successfully'
      
      toast({
        title: 'Success!',
        description: successMessage,
      })
      
      // Reset form
      setEntityType(null)
      setCurrentStep('selection')
      setUploadedFiles([])
      companyForm.reset()
      agencyForm.reset()
      setSelectedState('')
      
    } catch (error: any) {
      console.error('Error submitting entity:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit entity onboarding',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const renderEntitySelection = () => (
    <Dialog open={currentStep === 'selection'} onOpenChange={() => navigate('/dashboard')}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Entity Onboarding</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <p className="text-center text-muted-foreground">
            Which type of entity do you want to onboard?
          </p>
          <RadioGroup onValueChange={(value) => handleEntitySelection(value as EntityType)}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company" className="flex items-center space-x-2 cursor-pointer flex-1">
                <Building2 className="h-5 w-5" />
                <span>Company</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="agency" id="agency" />
              <Label htmlFor="agency" className="flex items-center space-x-2 cursor-pointer flex-1">
                <Users className="h-5 w-5" />
                <span>Agency</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderCompanyDetailsForm = () => {
    const availableCities = selectedState ? cityMap[selectedState] || [] : []

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Company Onboarding Form</h2>
            <Progress value={50} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">Step 1 of 2: Company Details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the company</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="proprietor">Proprietor</SelectItem>
                            <SelectItem value="pvt">PVT</SelectItem>
                            <SelectItem value="llp">LLP</SelectItem>
                            <SelectItem value="trust">Trust</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyForm.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short description of the business</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the business" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="spocMail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="spoc@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="spocContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="spocUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Address</h3>
                  
                  <FormField
                    control={companyForm.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter address line 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter address line 2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedState(value)
                            companyForm.setValue('city', '') // Reset city when state changes
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableCities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pin Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="initiative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initiative</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter initiative" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="officeOwnership"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Ownership</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ownership" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="owned">Owned</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="lg">
                    Continue
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAgencyDetailsForm = () => {
    const availableCities = selectedState ? cityMap[selectedState] || [] : []

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Agency Onboarding Form</h2>
            <Progress value={50} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">Step 1 of 2: Agency Details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agency Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...agencyForm}>
              <form onSubmit={agencyForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={agencyForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of the agency</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter agency name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="proprietor">Proprietor</SelectItem>
                            <SelectItem value="pvt">PVT</SelectItem>
                            <SelectItem value="llp">LLP</SelectItem>
                            <SelectItem value="trust">Trust</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={agencyForm.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short description of the business</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the business" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={agencyForm.control}
                    name="spocMail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="spoc@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="spocContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="spocUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPOC Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Address</h3>
                  
                  <FormField
                    control={agencyForm.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter address line 1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter address line 2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={agencyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedState(value)
                            agencyForm.setValue('city', '') // Reset city when state changes
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={agencyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedState}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableCities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pin Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={agencyForm.control}
                  name="officeOwnership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Ownership</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ownership" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="owned">Owned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agencyForm.control}
                  name="mapWith"
                  render={() => (
                    <FormItem>
                      <FormLabel>Map with Companies (Select up to 6)</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mockCompanies.map((company) => (
                          <FormField
                            key={company}
                            control={agencyForm.control}
                            name="mapWith"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={company}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(company)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || []
                                        if (checked) {
                                          if (currentValues.length < 6) {
                                            field.onChange([...currentValues, company])
                                          }
                                        } else {
                                          field.onChange(
                                            currentValues.filter((value) => value !== company)
                                          )
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {company}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" size="lg">
                    Continue
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDetailsForm = () => {
    if (entityType === 'company') {
      return renderCompanyDetailsForm()
    } else {
      return renderAgencyDetailsForm()
    }
  }

  const renderDocumentsForm = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('details')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {entityType === 'company' ? 'Company' : 'Agency'} Onboarding Form
          </h2>
          <Progress value={100} className="mt-2" />
          <p className="text-sm text-muted-foreground mt-1">
            Step 2 of 2: {entityType === 'company' ? 'Company' : 'Agency'} Documents
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{entityType === 'company' ? 'Company' : 'Agency'} Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-muted-foreground mb-4">
              Click to browse or drag and drop your files here
            </p>
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Choose Files</span>
              </Button>
            </Label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDelete(index)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleFinalSubmit} size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto py-6 px-4">
      {currentStep === 'selection' && renderEntitySelection()}
      {currentStep === 'details' && renderDetailsForm()}
      {currentStep === 'documents' && renderDocumentsForm()}
    </div>
  )
}