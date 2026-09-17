export type AuthFormState = {
  message: string
  status: 'idle' | 'error'
}

export const initialAuthFormState: AuthFormState = {
  message: '',
  status: 'idle',
}
