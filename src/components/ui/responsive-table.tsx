import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T, index?: number) => React.ReactNode
  priority?: 'high' | 'medium' | 'low' // For mobile column prioritization
  mobileLabel?: string // Custom label for mobile card view
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  emptyState?: React.ReactNode
  actions?: (item: T) => React.ReactNode
}

function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  emptyState,
  actions
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  // Filter columns for mobile (show only high priority)
  const visibleColumns = isMobile 
    ? columns.filter(col => col.priority === 'high' || !col.priority)
    : columns

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.length === 0 ? (
          emptyState || <div className="text-center text-muted-foreground py-8">No data available</div>
        ) : (
          data.map((item, index) => (
            <Card key={index} className="w-full">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {columns.map((column) => {
                    const value = column.render 
                      ? column.render(item, index)
                      : item[column.key as keyof T]
                    
                    if (value === null || value === undefined || value === '') return null
                    
                    return (
                      <div key={String(column.key)} className="flex justify-between items-start gap-3">
                        <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0">
                          {column.mobileLabel || column.header}:
                        </span>
                        <div className="text-sm text-right min-w-0 flex-1">
                          {value}
                        </div>
                      </div>
                    )
                  })}
                  {actions && (
                    <div className="flex justify-end pt-2 border-t">
                      {actions(item)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="px-6 py-8">
                {emptyState || <div className="text-center text-muted-foreground">No data available</div>}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-muted/50">
                {visibleColumns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm">
                    {column.render ? column.render(item, index) : item[column.key as keyof T]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export { ResponsiveTable, type Column }