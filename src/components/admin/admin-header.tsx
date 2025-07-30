"use client"

interface AdminHeaderProps {
  title?: string
  description?: string
}

export const AdminHeader = ({
  title = "System Administration",
  description = "Manage and monitor system activities",
}: AdminHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
