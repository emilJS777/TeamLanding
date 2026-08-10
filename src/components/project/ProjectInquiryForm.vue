<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import {
  budgetOptions,
  expertiseOptions,
  projectStages,
  projectTypes,
  startDateOptions
} from '../../../shared/projectInquiryOptions'
import { submitProjectInquiry } from '../../services/projectInquiryService'

const initialForm = () => ({
  fullName: '', workEmail: '', companyName: '', companyWebsite: '', projectTitle: '',
  projectType: '', projectStage: '', expertise: [], expectedStartDate: '', budget: '',
  description: '', relevantLinks: '', timezone: '', consent: false, website: '',
  startedAt: Date.now()
})

const form = reactive(initialForm())
const errors = reactive({})
const status = ref('idle')
const inquiryId = ref('')
const formElement = ref(null)
const remainingDescription = computed(() => 4000 - form.description.length)

function validateUrl(value) {
  if (!value.trim()) return true
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol)
  } catch { return false }
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key])
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail.trim())) errors.workEmail = 'Enter a valid work email.'
  if (form.companyWebsite && !validateUrl(form.companyWebsite)) errors.companyWebsite = 'Enter a complete http:// or https:// URL.'
  if (form.projectTitle.trim().length < 3) errors.projectTitle = 'Enter a short project title.'
  if (!projectTypes.includes(form.projectType)) errors.projectType = 'Select a project type.'
  if (!projectStages.includes(form.projectStage)) errors.projectStage = 'Select the current stage.'
  if (!form.expertise.length) errors.expertise = 'Select at least one option.'
  if (!startDateOptions.includes(form.expectedStartDate)) errors.expectedStartDate = 'Select an expected start date.'
  if (!budgetOptions.includes(form.budget)) errors.budget = 'Select an approximate budget.'
  if (form.description.trim().length < 50) errors.description = 'Add at least 50 characters.'
  if (form.description.length > 4000) errors.description = 'Keep the description under 4,000 characters.'
  const links = form.relevantLinks.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)
  if (links.length > 8 || links.some((link) => !validateUrl(link))) errors.relevantLinks = 'Add up to 8 complete URLs, one per line.'
  if (!form.consent) errors.consent = 'Consent is required to submit the inquiry.'
  return Object.keys(errors).length === 0
}

async function focusFirstError() {
  await nextTick()
  formElement.value?.querySelector('[aria-invalid="true"]')?.focus()
}

async function submit() {
  if (status.value === 'submitting') return
  status.value = 'idle'
  if (!validate()) return focusFirstError()
  status.value = 'submitting'
  try {
    const result = await submitProjectInquiry({ ...form, expertise: [...form.expertise] })
    inquiryId.value = result.inquiryId || ''
    status.value = 'success'
    await nextTick()
    document.querySelector('.inquiry-success')?.focus()
  } catch (error) {
    if (error.fields) Object.assign(errors, error.fields)
    status.value = 'error'
    if (Object.keys(errors).length) focusFirstError()
  }
}

function resetForm() {
  Object.assign(form, initialForm())
  Object.keys(errors).forEach((key) => delete errors[key])
  inquiryId.value = ''
  status.value = 'idle'
  nextTick(() => formElement.value?.querySelector('input')?.focus())
}
</script>

<template>
  <section class="inquiry-card" aria-labelledby="inquiry-form-title">
    <div v-if="status === 'success'" class="inquiry-success" tabindex="-1" aria-live="polite">
      <div class="status-icon" aria-hidden="true">✓</div>
      <p class="eyebrow"><span></span> Inquiry received</p>
      <h2>Thank you. We’ve received your project inquiry.</h2>
      <p>Our team will review the details and respond within 1–2 business days. If there’s a potential fit, we’ll invite you to a discovery call.</p>
      <p v-if="inquiryId" class="inquiry-id">Inquiry ID <strong>{{ inquiryId }}</strong></p>
      <div class="success-actions">
        <RouterLink class="button button--outline" to="/">Back to the team</RouterLink>
        <button class="button button--primary" type="button" @click="resetForm">Submit another inquiry</button>
      </div>
    </div>

    <form v-else ref="formElement" novalidate @submit.prevent="submit">
      <div class="form-heading">
        <p class="eyebrow"><span></span> Project inquiry</p>
        <h2 id="inquiry-form-title">Project details</h2>
        <p>Required fields are marked with <span aria-hidden="true">*</span>.</p>
      </div>

      <div class="form-section">
        <h3>Contact details</h3>
        <div class="form-grid">
          <div class="field">
            <label for="fullName">Full name <span>*</span></label>
            <input id="fullName" v-model="form.fullName" name="fullName" autocomplete="name" required maxlength="120" :aria-invalid="Boolean(errors.fullName)" :aria-describedby="errors.fullName ? 'fullName-error' : undefined">
            <small v-if="errors.fullName" id="fullName-error" class="field-error">{{ errors.fullName }}</small>
          </div>
          <div class="field">
            <label for="workEmail">Work email <span>*</span></label>
            <input id="workEmail" v-model="form.workEmail" name="workEmail" type="email" autocomplete="email" required maxlength="254" :aria-invalid="Boolean(errors.workEmail)" :aria-describedby="errors.workEmail ? 'workEmail-error' : undefined">
            <small v-if="errors.workEmail" id="workEmail-error" class="field-error">{{ errors.workEmail }}</small>
          </div>
          <div class="field">
            <label for="companyName">Company or project name</label>
            <input id="companyName" v-model="form.companyName" name="companyName" autocomplete="organization" maxlength="160">
          </div>
          <div class="field">
            <label for="companyWebsite">Company website</label>
            <input id="companyWebsite" v-model="form.companyWebsite" name="companyWebsite" type="url" autocomplete="url" placeholder="https://" maxlength="500" :aria-invalid="Boolean(errors.companyWebsite)" :aria-describedby="errors.companyWebsite ? 'companyWebsite-error' : undefined">
            <small v-if="errors.companyWebsite" id="companyWebsite-error" class="field-error">{{ errors.companyWebsite }}</small>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>What are you planning?</h3>
        <div class="field">
          <label for="projectTitle">What would you like to build? <span>*</span></label>
          <input id="projectTitle" v-model="form.projectTitle" name="projectTitle" required maxlength="180" placeholder="A short working title" :aria-invalid="Boolean(errors.projectTitle)" :aria-describedby="errors.projectTitle ? 'projectTitle-error' : undefined">
          <small v-if="errors.projectTitle" id="projectTitle-error" class="field-error">{{ errors.projectTitle }}</small>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="projectType">Project type <span>*</span></label>
            <select id="projectType" v-model="form.projectType" name="projectType" required :aria-invalid="Boolean(errors.projectType)" :aria-describedby="errors.projectType ? 'projectType-error' : undefined">
              <option value="" disabled>Select type</option><option v-for="option in projectTypes" :key="option">{{ option }}</option>
            </select>
            <small v-if="errors.projectType" id="projectType-error" class="field-error">{{ errors.projectType }}</small>
          </div>
          <div class="field">
            <label for="projectStage">Project stage <span>*</span></label>
            <select id="projectStage" v-model="form.projectStage" name="projectStage" required :aria-invalid="Boolean(errors.projectStage)" :aria-describedby="errors.projectStage ? 'projectStage-error' : undefined">
              <option value="" disabled>Select stage</option><option v-for="option in projectStages" :key="option">{{ option }}</option>
            </select>
            <small v-if="errors.projectStage" id="projectStage-error" class="field-error">{{ errors.projectStage }}</small>
          </div>
        </div>
      </div>

      <fieldset class="form-section expertise-fieldset" :aria-describedby="errors.expertise ? 'expertise-error' : undefined">
        <legend>Required expertise <span>*</span></legend>
        <div class="checkbox-grid">
          <label v-for="option in expertiseOptions" :key="option" class="check-card">
            <input v-model="form.expertise" type="checkbox" name="expertise" :value="option" :aria-invalid="Boolean(errors.expertise)"><span>{{ option }}</span>
          </label>
        </div>
        <small v-if="errors.expertise" id="expertise-error" class="field-error">{{ errors.expertise }}</small>
      </fieldset>

      <div class="form-section form-grid">
        <div class="field">
          <label for="expectedStartDate">Expected start date <span>*</span></label>
          <select id="expectedStartDate" v-model="form.expectedStartDate" name="expectedStartDate" required :aria-invalid="Boolean(errors.expectedStartDate)" :aria-describedby="errors.expectedStartDate ? 'expectedStartDate-error' : undefined">
            <option value="" disabled>Select timing</option><option v-for="option in startDateOptions" :key="option">{{ option }}</option>
          </select>
          <small v-if="errors.expectedStartDate" id="expectedStartDate-error" class="field-error">{{ errors.expectedStartDate }}</small>
        </div>
        <div class="field">
          <label for="budget">Approximate budget <span>*</span></label>
          <select id="budget" v-model="form.budget" name="budget" required :aria-invalid="Boolean(errors.budget)" :aria-describedby="errors.budget ? 'budget-error' : undefined">
            <option value="" disabled>Select range</option><option v-for="option in budgetOptions" :key="option">{{ option }}</option>
          </select>
          <small v-if="errors.budget" id="budget-error" class="field-error">{{ errors.budget }}</small>
        </div>
      </div>

      <div class="form-section">
        <div class="field">
          <label for="description">Project description <span>*</span></label>
          <textarea id="description" v-model="form.description" name="description" rows="8" required minlength="50" maxlength="4000" placeholder="Goals, users, scope, constraints, existing technology and the outcome you need." :aria-invalid="Boolean(errors.description)" :aria-describedby="errors.description ? 'description-error description-count' : 'description-count'"></textarea>
          <div class="field-meta"><small v-if="errors.description" id="description-error" class="field-error">{{ errors.description }}</small><small id="description-count">{{ remainingDescription }} characters remaining</small></div>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="relevantLinks">Relevant links</label>
            <textarea id="relevantLinks" v-model="form.relevantLinks" name="relevantLinks" rows="4" maxlength="4000" placeholder="One https:// URL per line" :aria-invalid="Boolean(errors.relevantLinks)" :aria-describedby="errors.relevantLinks ? 'relevantLinks-error' : undefined"></textarea>
            <small v-if="errors.relevantLinks" id="relevantLinks-error" class="field-error">{{ errors.relevantLinks }}</small>
          </div>
          <div class="field">
            <label for="timezone">Preferred meeting timezone</label>
            <input id="timezone" v-model="form.timezone" name="timezone" maxlength="100" placeholder="e.g. UTC+4 / Yerevan">
          </div>
        </div>
      </div>

      <div class="bot-field" aria-hidden="true">
        <label for="website">Leave this field empty</label><input id="website" v-model="form.website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <label class="consent-field">
        <input v-model="form.consent" type="checkbox" name="consent" required :aria-invalid="Boolean(errors.consent)" :aria-describedby="errors.consent ? 'consent-error' : undefined">
        <span>I agree that DENeon may use this information to review and respond to my project inquiry.</span>
      </label>
      <small v-if="errors.consent" id="consent-error" class="field-error consent-error">{{ errors.consent }}</small>

      <div v-if="status === 'error'" class="form-alert form-alert--error" role="alert" aria-live="assertive">
        <strong>We couldn’t send your request right now.</strong>
        <p>Your entered information has been preserved. Please try again.</p>
        <p>Or contact us at <a href="mailto:deneonofficial@gmail.com">deneonofficial@gmail.com</a>.</p>
      </div>

      <button class="button button--primary submit-button" type="submit" :disabled="status === 'submitting'">
        <span v-if="status === 'submitting'" class="spinner" aria-hidden="true"></span>
        {{ status === 'submitting' ? 'Sending inquiry…' : status === 'error' ? 'Try again' : 'Send project inquiry' }}
        <span v-if="status !== 'submitting'" aria-hidden="true">→</span>
      </button>
    </form>
  </section>
</template>
