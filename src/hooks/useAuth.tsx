import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent'

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  signIn: (email: string, password: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session and stored role
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // First check if we have a stored role for this session
        const storedRole = sessionStorage.getItem(`userRole_${session.user.id}`)
        if (storedRole) {
          console.log('Restoring stored role:', storedRole)
          setUserRole(storedRole as UserRole)
        } else {
          // Fallback to fetching from database
          fetchUserRole(session.user.id)
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (!session?.user) {
        setUserRole(null)
        // Clear stored role on logout
        sessionStorage.removeItem(`userRole_${session?.user?.id || ''}`)
      } else {
        // Restore role from storage when session is restored
        const storedRole = sessionStorage.getItem(`userRole_${session.user.id}`)
        if (storedRole) {
          console.log('Auth state changed - restoring role:', storedRole)
          setUserRole(storedRole as UserRole)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (!error && data) {
        console.log('Fetched user role:', data.role)
        setUserRole(data.role as UserRole)
      } else if (error) {
        console.error('Error fetching user role:', error)
      } else {
        console.log('No role found for user:', userId)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    
    if (error) throw error
    
    // Insert user role after successful signup
    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { 
            user_id: data.user.id, 
            role,
            username: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            contact_number: '0000000000',
            company: 'Default Company'
          }
        ])
      
      if (roleError) throw roleError
    }
  }

  const signIn = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Set the selected role for this session and store it
    if (data.user) {
      console.log('Setting user role to:', role)
      setUserRole(role)
      // Store role in sessionStorage for persistence
      sessionStorage.setItem(`userRole_${data.user.id}`, role)
    }
  }

  const signOut = async () => {
    // Clear stored role before signing out
    if (user) {
      sessionStorage.removeItem(`userRole_${user.id}`)
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUserRole(null)
  }

  const value = {
    user,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}