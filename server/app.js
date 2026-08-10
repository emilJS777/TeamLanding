import crypto from 'node:crypto'
import express from 'express'
import { buildContactMessage, buildInquiryMessage, contactMailSettings, createMailTransport, mailSettings } from './mail.js'
import { createRateLimiter } from './rateLimit.js'
import { isLikelyBot, validateContactMessage, validateInquiry } from './validation.js'

const defaultOrigins = [
  'https://team.deneon.net',
  'https://www.team.deneon.net',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://localhost:5173'
]

function recordId(prefix, date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll('-', '')
  return `${prefix}-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export function createApiApp({ env = process.env, transport, rateLimiter } = {}) {
  const app = express()
  const limiter = rateLimiter || createRateLimiter({ max: Number(env.PROJECT_INQUIRY_RATE_LIMIT || 5) })
  const contactLimiter = createRateLimiter({ max: Number(env.CONTACT_MESSAGE_RATE_LIMIT || 8) })
  const allowedOrigins = new Set((env.ALLOWED_ORIGINS || defaultOrigins.join(',')).split(',').map((item) => item.trim()).filter(Boolean))
  const mailer = transport === undefined ? createMailTransport(env) : transport
  const settings = mailSettings(env)
  const contactSettings = contactMailSettings(env)

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(express.json({ limit: '32kb', strict: true }))
  app.use((request, response, next) => {
    response.set('Cache-Control', 'no-store')
    response.set('X-Content-Type-Options', 'nosniff')
    const origin = request.get('origin')
    if (origin && !allowedOrigins.has(origin)) return response.status(403).json({ message: 'Request origin is not allowed.' })
    if (origin) response.set('Access-Control-Allow-Origin', origin).set('Vary', 'Origin')
    next()
  })

  app.get('/api/healthz', (_request, response) => response.json({ status: 'ok', smtpConfigured: Boolean(mailer) }))

  app.post('/api/project-inquiries', async (request, response) => {
    const id = recordId('DN')
    const result = validateInquiry(request.body)
    if (isLikelyBot(result.data)) return response.status(202).json({ success: true, inquiryId: id })
    if (!result.valid) return response.status(422).json({ message: 'Please review the highlighted fields.', fields: result.errors })
    if (!limiter(request.ip || 'unknown').allowed) return response.status(429).json({ message: 'Too many requests. Please try again later.' })
    if (!mailer) return response.status(503).json({ message: 'We could not send your request right now.' })

    const submittedAt = new Date().toISOString()
    const message = buildInquiryMessage({ ...result.data, inquiryId: id, submittedAt }, settings)
    try {
      await mailer.sendMail(message)
      return response.status(201).json({ success: true, inquiryId: id, submittedAt })
    } catch (error) {
      console.error('Project inquiry delivery failed', { inquiryId: id, code: error?.code || 'SMTP_ERROR' })
      return response.status(502).json({ message: 'We could not send your request right now.' })
    }
  })

  app.post('/api/contact-messages', async (request, response) => {
    const id = recordId('CM')
    const result = validateContactMessage(request.body)
    if (isLikelyBot(result.data)) return response.status(202).json({ success: true, messageId: id })
    if (!result.valid) return response.status(422).json({ message: 'Please review the highlighted fields.', fields: result.errors })
    if (!contactLimiter(request.ip || 'unknown').allowed) return response.status(429).json({ message: 'Too many requests. Please try again later.' })
    if (!mailer) return response.status(503).json({ message: 'We could not send your message right now.' })

    const submittedAt = new Date().toISOString()
    const message = buildContactMessage({ ...result.data, messageId: id, submittedAt }, contactSettings)
    try {
      await mailer.sendMail(message)
      return response.status(201).json({ success: true, messageId: id, submittedAt })
    } catch (error) {
      console.error('Contact message delivery failed', { messageId: id, code: error?.code || 'SMTP_ERROR' })
      return response.status(502).json({ message: 'We could not send your message right now.' })
    }
  })

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.too.large') return response.status(413).json({ message: 'Request is too large.' })
    if (error instanceof SyntaxError) return response.status(400).json({ message: 'Invalid request.' })
    console.error('Project inquiry API error', { code: error?.code || 'UNEXPECTED_ERROR' })
    return response.status(500).json({ message: 'We could not process your request.' })
  })
  return app
}
