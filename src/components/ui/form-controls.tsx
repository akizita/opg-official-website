import type { ComponentPropsWithoutRef } from 'react'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label: string
}

export function Input({ id, label, ...props }: InputProps) {
  if (!id) throw new Error('Input requires an id so its label is associated')

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...props} />
    </label>
  )
}

type TextAreaProps = ComponentPropsWithoutRef<'textarea'> & {
  label: string
}

export function TextArea({ id, label, ...props }: TextAreaProps) {
  if (!id) throw new Error('TextArea requires an id so its label is associated')

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} {...props} />
    </label>
  )
}
