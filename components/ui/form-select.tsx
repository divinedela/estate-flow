import { SelectHTMLAttributes, LabelHTMLAttributes } from 'react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>
}

export function FormSelect({ label, error, labelProps, options, className = '', ...props }: FormSelectProps) {
  return (
    <div>
      {label && (
        <label
          {...labelProps}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}



