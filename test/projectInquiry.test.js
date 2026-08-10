import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createApiApp } from '../server/app.js'
import { buildContactMessage, buildInquiryMessage } from '../server/mail.js'
import { createRateLimiter } from '../server/rateLimit.js'
import { validateContactMessage, validateInquiry } from '../server/validation.js'

const servers = []
afterEach(() => { while (servers.length) servers.pop().close() })

function validPayload(overrides = {}) {
  return {
    fullName: 'Alex Morgan', workEmail: 'alex@example.com', companyName: 'Acme',
    companyWebsite: 'https://example.com', projectTitle: 'Customer operations platform',
    projectType: 'Web application', projectStage: 'Idea or discovery',
    expertise: ['Product management', 'Full-stack development'], expectedStartDate: 'Within 1–3 months',
    budget: '$15,000–$30,000', description: 'We need a secure customer operations platform with reporting and role-based access.',
    relevantLinks: 'https://example.com/brief', timezone: 'UTC+4', consent: true, website: '',
    startedAt: Date.now() - 5000, ...overrides
  }
}

function validContactPayload(overrides = {}) {
  return {
    fullName: 'Taylor Reed', email: 'taylor@example.com', company: 'Example Co',
    subject: 'Partnership', message: 'We would like to discuss a potential technology partnership.',
    consent: true, website: '', startedAt: Date.now() - 5000, ...overrides
  }
}

async function request(app, payload, path = '/api/project-inquiries') {
  const server = app.listen(0, '127.0.0.1')
  servers.push(server)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://team.deneon.net' },
    body: JSON.stringify(payload)
  })
}

test('accepts a valid inquiry and normalizes data', () => {
  const result = validateInquiry(validPayload({ fullName: '  Alex Morgan  ' }))
  assert.equal(result.valid, true)
  assert.equal(result.data.fullName, 'Alex Morgan')
})

test('rejects invalid email and unknown allowlist values', () => {
  const result = validateInquiry(validPayload({ workEmail: 'not-an-email', projectType: 'Injected type' }))
  assert.equal(result.valid, false)
  assert.ok(result.errors.workEmail)
  assert.ok(result.errors.projectType)
})

test('honeypot gets a generic accepted response without sending mail', async () => {
  let sent = 0
  const response = await request(createApiApp({ transport: { sendMail: async () => { sent += 1 } } }), validPayload({ website: 'bot.example' }))
  assert.equal(response.status, 202)
  assert.equal(sent, 0)
})

test('successful response returns inquiry ID and server timestamp', async () => {
  const messages = []
  const response = await request(createApiApp({ transport: { sendMail: async (message) => messages.push(message) } }), validPayload())
  const body = await response.json()
  assert.equal(response.status, 201)
  assert.match(body.inquiryId, /^DN-\d{8}-[A-F0-9-]{8}$/)
  assert.ok(body.submittedAt)
  assert.equal(messages.length, 1)
})

test('frontend cannot override the configured recipient', async () => {
  const messages = []
  const app = createApiApp({ env: { PROJECT_INQUIRY_RECIPIENT: 'owner@example.com' }, transport: { sendMail: async (message) => messages.push(message) } })
  await request(app, validPayload({ recipient: 'attacker@example.com' }))
  assert.equal(messages[0].to, 'owner@example.com')
})

test('SMTP errors return a generic response without internal details', async () => {
  const app = createApiApp({ transport: { sendMail: async () => { const error = new Error('secret smtp diagnostic'); error.code = 'EAUTH'; throw error } } })
  const response = await request(app, validPayload())
  const body = await response.json()
  assert.equal(response.status, 502)
  assert.equal(body.message, 'We could not send your request right now.')
  assert.doesNotMatch(JSON.stringify(body), /secret|EAUTH/)
})

test('HTML mail escapes user-controlled markup and includes plain text', () => {
  const { data } = validateInquiry(validPayload({ companyName: '<img src=x onerror=alert(1)>' }))
  const message = buildInquiryMessage({ ...data, inquiryId: 'DN-TEST', submittedAt: '2026-08-09T00:00:00.000Z' }, { recipient: 'owner@example.com', from: 'DENeon <owner@example.com>' })
  assert.match(message.html, /&lt;img/)
  assert.doesNotMatch(message.html, /<img src=x/)
  assert.match(message.text, /Project description:/)
})

test('rate limiter blocks requests beyond its configured limit', () => {
  let time = 1000
  const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => time })
  assert.equal(limiter('client').allowed, true)
  assert.equal(limiter('client').allowed, true)
  assert.equal(limiter('client').allowed, false)
  time = 2500
  assert.equal(limiter('client').allowed, true)
})

test('contact validation rejects invalid email, unknown subject and short message', () => {
  const result = validateContactMessage(validContactPayload({ email: 'wrong', subject: 'Sales relay', message: 'Too short' }))
  assert.equal(result.valid, false)
  assert.ok(result.errors.email)
  assert.ok(result.errors.subject)
  assert.ok(result.errors.message)
})

test('contact honeypot is accepted without sending mail', async () => {
  let sent = 0
  const response = await request(createApiApp({ transport: { sendMail: async () => { sent += 1 } } }), validContactPayload({ website: 'filled-by-bot' }), '/api/contact-messages')
  assert.equal(response.status, 202)
  assert.equal(sent, 0)
})

test('contact endpoint returns message ID after successful delivery', async () => {
  const messages = []
  const response = await request(createApiApp({ transport: { sendMail: async (message) => messages.push(message) } }), validContactPayload(), '/api/contact-messages')
  const body = await response.json()
  assert.equal(response.status, 201)
  assert.match(body.messageId, /^CM-\d{8}-[A-F0-9-]{8}$/)
  assert.ok(body.submittedAt)
  assert.equal(messages.length, 1)
})

test('contact recipient cannot be overridden by frontend', async () => {
  const messages = []
  const app = createApiApp({ env: { CONTACT_MESSAGE_RECIPIENT: 'contact-owner@example.com' }, transport: { sendMail: async (message) => messages.push(message) } })
  await request(app, validContactPayload({ recipient: 'attacker@example.com' }), '/api/contact-messages')
  assert.equal(messages[0].to, 'contact-owner@example.com')
})

test('contact mail escapes HTML and includes a plain-text body', () => {
  const { data } = validateContactMessage(validContactPayload({ company: '<b>Injected</b>', message: 'A message containing <script>alert(1)</script> markup.' }))
  const message = buildContactMessage({ ...data, messageId: 'CM-TEST', submittedAt: '2026-08-09T00:00:00.000Z' }, { recipient: 'owner@example.com', from: 'DENeon <owner@example.com>' })
  assert.match(message.html, /&lt;script&gt;/)
  assert.doesNotMatch(message.html, /<script>/)
  assert.match(message.text, /Message ID:/)
  assert.equal(message.replyTo, 'taylor@example.com')
})

test('contact SMTP errors remain generic', async () => {
  const app = createApiApp({ transport: { sendMail: async () => { throw new Error('private smtp failure') } } })
  const response = await request(app, validContactPayload(), '/api/contact-messages')
  const body = await response.json()
  assert.equal(response.status, 502)
  assert.equal(body.message, 'We could not send your message right now.')
  assert.doesNotMatch(JSON.stringify(body), /private smtp failure/)
})

test('contact endpoint rate limits repeated messages', async () => {
  const app = createApiApp({ env: { CONTACT_MESSAGE_RATE_LIMIT: '2' }, transport: { sendMail: async () => {} } })
  assert.equal((await request(app, validContactPayload(), '/api/contact-messages')).status, 201)
  assert.equal((await request(app, validContactPayload(), '/api/contact-messages')).status, 201)
  assert.equal((await request(app, validContactPayload(), '/api/contact-messages')).status, 429)
})
