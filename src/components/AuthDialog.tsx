import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'signin' | 'signup'
}

export const AuthDialog = ({ open, onOpenChange, defaultMode = 'signin' }: AuthDialogProps) => {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) throw error
        
        toast({
          title: 'Password reset email sent!',
          description: 'Please check your email for password reset instructions.',
        })
        setIsForgotPassword(false)
        setEmail('')
      } else if (isSignUp) {
        await signUp(email, password)
        toast({
          title: 'Success!',
          description: 'Account created successfully. Please check your email to verify your account.',
        })
      } else {
        await signIn(email, password)
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        })
        
        // Close dialog and redirect to dashboard
        onOpenChange(false)
        navigate('/dashboard')
      }
      
      // Reset form
      if (!isForgotPassword) {
        setEmail('')
        setPassword('')
      }
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setNewPassword('')
    setIsForgotPassword(false)
    setIsSignUp(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetForm()
    }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isForgotPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          {isForgotPassword ? (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setIsForgotPassword(false)}
                type="button"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                type="button"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}