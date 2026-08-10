<script setup>
import { nextTick, reactive, ref } from 'vue'
import { contactSubjects } from '../../../shared/contactMessageOptions'
import { sendContactMessage } from '../../services/contactService'

const emptyForm = () => ({
  fullName: '', email: '', company: '', subject: '', message: '', consent: false,
  website: '', startedAt: Date.now()
})

const form = reactive(emptyForm())
const errors = reactive({})
const status = ref('idle')
const messageId = ref('')
const formElement = ref(null)

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key])
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!contactSubjects.includes(form.subject)) errors.subject = 'Select a subject.'
  if (form.message.trim().length < 20) errors.message = 'Add at least 20 characters.'
  if (form.message.length > 3000) errors.message = 'Keep your message under 3,000 characters.'
  if (!form.consent) errors.consent = 'Consent is required to send your message.'
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
    const result = await sendContactMessage({ ...form })
    messageId.value = result.messageId || ''
    status.value = 'success'
    await nextTick()
    document.querySelector('.contact-success')?.focus()
  } catch (error) {
    if (error.fields) Object.assign(errors, error.fields)
    status.value = 'error'
    if (Object.keys(errors).length) focusFirstError()
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  Object.keys(errors).forEach((key) => delete errors[key])
  status.value = 'idle'
  messageId.value = ''
  nextTick(() => formElement.value?.querySelector('input')?.focus())
}
</script>

<template>
  <section class="inquiry-card contact-form-card" aria-labelledby="contact-form-title">
    <div v-if="status === 'success'" class="inquiry-success contact-success" tabindex="-1" aria-live="polite">
      <div class="status-icon" aria-hidden="true">✓</div>
      <p class="eyebrow"><span></span> Message sent</p>
      <h2>Thank you. Your message has been sent.</h2>
      <p>We’ll review your message and respond within 1–2 business days.</p>
      <p v-if="messageId" class="inquiry-id">Message ID <strong>{{ messageId }}</strong></p>
      <div class="success-actions">
        <RouterLink class="button button--outline" to="/">Back to the team</RouterLink>
        <button class="button button--primary" type="button" @click="resetForm">Send another message</button>
      </div>
    </div>

    <form v-else ref="formElement" novalidate @submit.prevent="submit">
      <div class="form-heading">
        <p class="eyebrow"><span></span> Contact DENeon</p>
        <h2 id="contact-form-title">Send a message</h2>
        <p>Required fields are marked with <span aria-hidden="true">*</span>.</p>
      </div>

      <div class="form-section form-grid">
        <div class="field">
          <label for="contactFullName">Full name <span>*</span></label>
          <input id="contactFullName" v-model="form.fullName" name="fullName" autocomplete="name" required maxlength="120" :aria-invalid="Boolean(errors.fullName)" :aria-describedby="errors.fullName ? 'contactFullName-error' : undefined">
          <small v-if="errors.fullName" id="contactFullName-error" class="field-error">{{ errors.fullName }}</small>
        </div>
        <div class="field">
          <label for="contactEmail">Email <span>*</span></label>
          <input id="contactEmail" v-model="form.email" name="email" type="email" autocomplete="email" required maxlength="254" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'contactEmail-error' : undefined">
          <small v-if="errors.email" id="contactEmail-error" class="field-error">{{ errors.email }}</small>
        </div>
        <div class="field">
          <label for="contactCompany">Company</label>
          <input id="contactCompany" v-model="form.company" name="company" autocomplete="organization" maxlength="160">
        </div>
        <div class="field">
          <label for="contactSubject">Subject <span>*</span></label>
          <select id="contactSubject" v-model="form.subject" name="subject" required :aria-invalid="Boolean(errors.subject)" :aria-describedby="errors.subject ? 'contactSubject-error' : undefined">
            <option value="" disabled>Select subject</option>
            <option v-for="option in contactSubjects" :key="option">{{ option }}</option>
          </select>
          <small v-if="errors.subject" id="contactSubject-error" class="field-error">{{ errors.subject }}</small>
        </div>
      </div>

      <div class="form-section">
        <div class="field">
          <label for="contactMessage">Message <span>*</span></label>
          <textarea id="contactMessage" v-model="form.message" name="message" rows="9" required minlength="20" maxlength="3000" placeholder="How can we help?" :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'contactMessage-error contactMessage-count' : 'contactMessage-count'"></textarea>
          <div class="field-meta">
            <small v-if="errors.message" id="contactMessage-error" class="field-error">{{ errors.message }}</small>
            <small id="contactMessage-count">{{ 3000 - form.message.length }} characters remaining</small>
          </div>
        </div>
      </div>

      <div class="bot-field" aria-hidden="true">
        <label for="contactWebsite">Leave this field empty</label>
        <input id="contactWebsite" v-model="form.website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <label class="consent-field">
        <input v-model="form.consent" type="checkbox" name="consent" required :aria-invalid="Boolean(errors.consent)" :aria-describedby="errors.consent ? 'contactConsent-error' : undefined">
        <span>I agree that DENeon may use this information to respond to my message.</span>
      </label>
      <small v-if="errors.consent" id="contactConsent-error" class="field-error consent-error">{{ errors.consent }}</small>

      <div v-if="status === 'error'" class="form-alert form-alert--error" role="alert" aria-live="assertive">
        <strong>We couldn’t send your message right now.</strong>
        <p>Your entered information has been preserved. Please try again.</p>
        <p>Or email us at <a href="mailto:deneonofficial@gmail.com">deneonofficial@gmail.com</a>.</p>
      </div>

      <button class="button button--primary submit-button" type="submit" :disabled="status === 'submitting'">
        <span v-if="status === 'submitting'" class="spinner" aria-hidden="true"></span>
        {{ status === 'submitting' ? 'Sending message…' : status === 'error' ? 'Try again' : 'Send message' }}
        <span v-if="status !== 'submitting'" aria-hidden="true">→</span>
      </button>

      <div class="project-prompt">
        <span>Looking to build a product?</span>
        <RouterLink to="/start-project">Start a project <span>→</span></RouterLink>
      </div>
    </form>
  </section>
</template>
