<script setup>
import { onMounted, ref } from 'vue'
import ProjectInquiryForm from '../components/project/ProjectInquiryForm.vue'

const mobileMenuOpen = ref(false)

onMounted(() => {
  document.title = 'Start a Project | DENeon Team'
  const description = document.querySelector('meta[name="description"]')
  description?.setAttribute('content', 'Tell the DENeon team about your web, backend, mobile, blockchain or QA project and request a discovery call.')
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = 'https://team.deneon.net/start-project'
})

const goodFitItems = [
  'Web and backend platforms', 'Mobile applications', 'Blockchain and Web3 products',
  'QA and test automation', 'Existing product modernization', 'Dedicated cross-functional teams'
]
const processItems = [
  'We review your request', 'We identify the required specialists',
  'We schedule a discovery call', 'We prepare a delivery approach'
]
</script>

<template>
  <div class="site-shell project-page">
    <header class="header">
      <RouterLink class="brand" to="/" aria-label="DENeon Team home">
        <img style="width: 40px" src="https://i.imgur.com/vpNOEYX.png" alt="">
        <span class="brand-name">DENeon <b>Team</b></span>
      </RouterLink>
      <button class="menu-toggle" type="button" :aria-expanded="mobileMenuOpen" aria-label="Toggle navigation" @click="mobileMenuOpen = !mobileMenuOpen"><span></span><span></span></button>
      <nav :class="['nav', { 'nav--open': mobileMenuOpen }]" aria-label="Main navigation">
        <RouterLink to="/" @click="mobileMenuOpen = false">Team overview</RouterLink>
        <RouterLink to="/contact" @click="mobileMenuOpen = false">Contact</RouterLink>
        <a href="#project-form" @click="mobileMenuOpen = false">Project form</a>
        <a href="#process" @click="mobileMenuOpen = false">Process</a>
      </nav>
      <RouterLink class="button button--small button--outline desktop-cta" to="/">Back to the team</RouterLink>
    </header>

    <main>
      <section class="project-hero">
        <div class="project-grid-overlay" aria-hidden="true"></div>
        <div class="project-hero-copy">
          <p class="eyebrow"><span></span> Start a project</p>
          <h1>Tell us what<br><em>you’re building.</em></h1>
          <p>Share your goals, current stage and technical needs. We’ll review your request and assemble the right combination of product, engineering, mobile and quality expertise.</p>
        </div>
        <div class="response-card">
          <span class="response-pulse" aria-hidden="true"></span>
          <div><small>Response time</small><strong>Within 1–2 business days</strong></div>
        </div>
      </section>

      <section id="project-form" class="project-content">
        <ProjectInquiryForm />
        <aside id="process" class="project-aside" aria-label="Project inquiry information">
          <section>
            <p class="eyebrow"><span></span> Good fit for</p>
            <h2>Built for product work.</h2>
            <ul class="fit-list"><li v-for="item in goodFitItems" :key="item">{{ item }}</li></ul>
          </section>
          <section class="inquiry-process">
            <p class="eyebrow"><span></span> What happens next</p>
            <ol><li v-for="(item, index) in processItems" :key="item"><span>0{{ index + 1 }}</span><strong>{{ item }}</strong></li></ol>
          </section>
          <section class="privacy-note">
            <strong>Your information stays focused.</strong>
            <p>We use your details only to assess and respond to this project inquiry. No automated client email is sent.</p>
          </section>
        </aside>
      </section>
    </main>

    <footer class="footer">
      <RouterLink class="brand" to="/"><img style="width: 40px" src="https://i.imgur.com/vpNOEYX.png" alt=""><span class="brand-name">DENeon <b>Team</b></span></RouterLink>
      <p>Product engineering across web, mobile and blockchain.</p>
      <span>© {{ new Date().getFullYear() }} DENeon</span>
    </footer>
  </div>
</template>
