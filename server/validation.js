import {
  budgetOptions, expertiseOptions, projectStages, projectTypes, startDateOptions
} from '../shared/projectInquiryOptions.js'
import { contactSubjects } from '../shared/contactMessageOptions.js'

const EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/
const HEADER_BREAK = /[\r\n]/

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().replace(/\u0000/g, '').slice(0, max + 1) : ''
}

function validUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

function field(errors, name, message) { errors[name] = message }

export function validateInquiry(input = {}) {
  const errors = {}
  const data = {
    fullName: text(input.fullName, 120),
    workEmail: text(input.workEmail, 254).toLowerCase(),
    companyName: text(input.companyName, 160),
    companyWebsite: text(input.companyWebsite, 500),
    projectTitle: text(input.projectTitle, 180),
    projectType: text(input.projectType, 80),
    projectStage: text(input.projectStage, 80),
    expertise: Array.isArray(input.expertise) ? [...new Set(input.expertise.map((item) => text(item, 80)))] : [],
    expectedStartDate: text(input.expectedStartDate, 80),
    budget: text(input.budget, 80),
    description: text(input.description, 4000),
    relevantLinks: text(input.relevantLinks, 4000),
    timezone: text(input.timezone, 100),
    consent: input.consent === true,
    website: text(input.website, 200),
    startedAt: Number(input.startedAt)
  }

  if (data.fullName.length < 2 || data.fullName.length > 120 || HEADER_BREAK.test(data.fullName)) field(errors, 'fullName', 'Enter a valid full name.')
  if (!EMAIL.test(data.workEmail) || data.workEmail.length > 254 || HEADER_BREAK.test(data.workEmail)) field(errors, 'workEmail', 'Enter a valid work email.')
  if (data.companyName.length > 160 || HEADER_BREAK.test(data.companyName)) field(errors, 'companyName', 'Company name is too long.')
  if (data.companyWebsite && (!validUrl(data.companyWebsite) || data.companyWebsite.length > 500)) field(errors, 'companyWebsite', 'Enter a valid website URL.')
  if (data.projectTitle.length < 3 || data.projectTitle.length > 180 || HEADER_BREAK.test(data.projectTitle)) field(errors, 'projectTitle', 'Enter a valid project title.')
  if (!projectTypes.includes(data.projectType)) field(errors, 'projectType', 'Select a valid project type.')
  if (!projectStages.includes(data.projectStage)) field(errors, 'projectStage', 'Select a valid project stage.')
  if (!data.expertise.length || data.expertise.length > expertiseOptions.length || data.expertise.some((item) => !expertiseOptions.includes(item))) field(errors, 'expertise', 'Select valid expertise options.')
  if (!startDateOptions.includes(data.expectedStartDate)) field(errors, 'expectedStartDate', 'Select a valid start date.')
  if (!budgetOptions.includes(data.budget)) field(errors, 'budget', 'Select a valid budget.')
  if (data.description.length < 50 || data.description.length > 4000) field(errors, 'description', 'Description must be between 50 and 4,000 characters.')
  const links = data.relevantLinks.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  if (links.length > 8 || links.some((url) => !validUrl(url))) field(errors, 'relevantLinks', 'Enter up to 8 valid URLs.')
  data.relevantLinks = links
  if (!data.consent) field(errors, 'consent', 'Consent is required.')
  if (!Number.isFinite(data.startedAt)) field(errors, 'startedAt', 'Invalid form timestamp.')

  return { valid: Object.keys(errors).length === 0, errors, data }
}

export function isLikelyBot(data, now = Date.now()) {
  if (data.website) return true
  return Number.isFinite(data.startedAt) && now - data.startedAt < 1500
}

export function validateContactMessage(input = {}) {
  const errors = {}
  const data = {
    fullName: text(input.fullName, 120),
    email: text(input.email, 254).toLowerCase(),
    company: text(input.company, 160),
    subject: text(input.subject, 80),
    message: text(input.message, 3000),
    consent: input.consent === true,
    website: text(input.website, 200),
    startedAt: Number(input.startedAt)
  }

  if (data.fullName.length < 2 || data.fullName.length > 120 || HEADER_BREAK.test(data.fullName)) field(errors, 'fullName', 'Enter a valid full name.')
  if (!EMAIL.test(data.email) || data.email.length > 254 || HEADER_BREAK.test(data.email)) field(errors, 'email', 'Enter a valid email address.')
  if (data.company.length > 160 || HEADER_BREAK.test(data.company)) field(errors, 'company', 'Company name is too long.')
  if (!contactSubjects.includes(data.subject)) field(errors, 'subject', 'Select a valid subject.')
  if (data.message.length < 20 || data.message.length > 3000) field(errors, 'message', 'Message must be between 20 and 3,000 characters.')
  if (!data.consent) field(errors, 'consent', 'Consent is required.')
  if (!Number.isFinite(data.startedAt)) field(errors, 'startedAt', 'Invalid form timestamp.')

  return { valid: Object.keys(errors).length === 0, errors, data }
}
