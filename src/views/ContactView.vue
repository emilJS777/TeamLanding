<script setup>
import { onMounted, ref } from 'vue'
import ContactForm from '../components/contact/ContactForm.vue'

const mobileMenuOpen = ref(false)

onMounted(() => {
  document.title = 'Contact | DENeon Team'
  document.querySelector('meta[name="description"]')?.setAttribute('content', 'Contact the DENeon team about partnerships, technical questions, team availability and general inquiries.')
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = 'https://team.deneon.net/contact'
})

const contactTopics = ['Partnerships', 'Team availability', 'Technical questions', 'Media and community']
</script>

<template>
  <div class="site-shell project-page contact-page">
    <header class="header">
      <RouterLink class="brand" to="/" aria-label="DENeon Team home"><img style="width:40px" src="https://i.imgur.com/vpNOEYX.png" alt=""><span class="brand-name">DENeon <b>Team</b></span></RouterLink>
      <button class="menu-toggle" type="button" :aria-expanded="mobileMenuOpen" aria-label="Toggle navigation" @click="mobileMenuOpen = !mobileMenuOpen"><span></span><span></span></button>
      <nav :class="['nav', { 'nav--open': mobileMenuOpen }]" aria-label="Main navigation">
        <RouterLink to="/" @click="mobileMenuOpen = false">Team overview</RouterLink>
        <RouterLink to="/start-project" @click="mobileMenuOpen = false">Start a project</RouterLink>
        <a href="#contact-form" @click="mobileMenuOpen = false">Contact form</a>
      </nav>
      <RouterLink class="button button--small button--outline desktop-cta" to="/start-project">Start a project</RouterLink>
    </header>

    <main>
      <section class="project-hero contact-hero">
        <div class="project-grid-overlay" aria-hidden="true"></div>
        <div class="project-hero-copy">
          <p class="eyebrow"><span></span> Contact</p>
          <h1>Get in <em>touch.</em></h1>
          <p>Send us a message about partnerships, technical questions, team availability or anything else you’d like to discuss.</p>
        </div>
        <div class="response-card"><span class="response-pulse" aria-hidden="true"></span><div><small>Response time</small><strong>We usually respond within 1–2 business days.</strong></div></div>
      </section>

      <section id="contact-form" class="project-content contact-content">
        <ContactForm />
        <aside class="project-aside contact-aside" aria-label="Contact information">
          <section>
            <p class="eyebrow"><span></span> General contact</p>
            <h2>What can we discuss?</h2>
            <ul class="fit-list"><li v-for="topic in contactTopics" :key="topic">{{ topic }}</li></ul>
          </section>
          <section class="privacy-note">
            <strong>A direct conversation.</strong>
            <p>Your message is reviewed by the DENeon team and used only to respond to your request. We do not send an automatic reply.</p>
          </section>
        </aside>
      </section>
    </main>

    <footer class="footer">
      <RouterLink class="brand" to="/"><img style="width:40px" src="https://i.imgur.com/vpNOEYX.png" alt=""><span class="brand-name">DENeon <b>Team</b></span></RouterLink>
      <p>Product engineering across web, mobile and blockchain.</p>
      <span>© {{ new Date().getFullYear() }} DENeon</span>
    </footer>
  </div>
</template>
