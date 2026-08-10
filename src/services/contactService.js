const endpoint = import.meta.env.VITE_CONTACT_MESSAGE_API_URL || '/api/contact-messages'

export async function sendContactMessage(payload) {
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('NETWORK_ERROR')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(result.message || 'SUBMISSION_FAILED')
    error.status = response.status
    error.fields = result.fields || {}
    throw error
  }
  return result
}
