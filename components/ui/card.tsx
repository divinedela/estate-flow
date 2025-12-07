import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  actions?: ReactNode
}

export function Card({ children, className = '', title, actions }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}



