import { useEffect, useRef, useState } from 'react'

/**
 * Minimal form state. Validates on submit; afterwards, errors that are shown clear
 * as soon as the user fixes them. `validate(values)` returns { field: translationKey },
 * and `formError` is also a translation key, so messages follow a language switch.
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const validateRef = useRef(validate)
  validateRef.current = validate

  useEffect(() => {
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev
      const current = validateRef.current(values)
      // Only keep errors that were already visible and are still invalid.
      return Object.fromEntries(Object.keys(prev).filter((key) => current[key]).map((key) => [key, current[key]]))
    })
  }, [values])

  const setValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))

  const bind = (key) => ({
    value: values[key] ?? '',
    onChange: (event) => setValue(key, event.target.value),
  })

  const handleSubmit = (onValid) => async (event) => {
    event?.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      await onValid(values)
    } catch (error) {
      // Coded service errors (ValidationError) map to errors.<code> translation keys.
      setFormError(error.code ? `errors.${error.code}` : 'errors.generic')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setFormError('')
  }

  return { values, setValues, setValue, errors, bind, handleSubmit, submitting, formError, reset }
}
