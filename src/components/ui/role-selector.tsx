import React from 'react'
import { cn } from '@/lib/utils'

type UserRole = 'super_admin' | 'client_admin' | 'lead_assigner' | 'cpv_agent'

interface RoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
  className?: string
}

const roleLabels = {
  super_admin: 'Super Admin',
  client_admin: 'Client Admin', 
  lead_assigner: 'Lead Assigner',
  cpv_agent: 'CPV Agent'
}

export const RoleSelector = ({ value, onChange, className }: RoleSelectorProps) => {
  return (
    <div className={cn("grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg", className)}>
      {Object.entries(roleLabels).map(([roleValue, label]) => (
        <button
          key={roleValue}
          type="button"
          onClick={() => onChange(roleValue as UserRole)}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
            "hover:bg-background/80 hover:shadow-sm",
            value === roleValue
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}