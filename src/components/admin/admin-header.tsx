"use client"

interface AdminHeaderProps {
  title: string
  description: string
}

export const AdminHeader = ({ title, description }: AdminHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-regular-white-cl mb-2">{title}</h1>
      <p className="text-regular-text-secondary-cl">{description}</p>
    </div>
  )
}
