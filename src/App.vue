<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { team } from './data/team'

const teamGroupDefinitions = [
  {
    id: 'product-management',
    title: 'Product Management',
    description:
        'Product strategy, discovery, roadmapping, analytics and cross-functional delivery.',
    memberIds: [
      'varduhi-samvelyan'
    ]
  },
  {
    id: 'mobile-engineering',
    title: 'Mobile Engineering',
    description:
        'Native Android, cross-platform mobile applications and connected product experiences.',
    memberIds: [
      'hermine-sanasaryan',
      'tigran-torgomyan'
    ]
  },
  {
    id: 'quality-engineering',
    title: 'Quality Engineering',
    description:
        'Manual testing, test automation, API validation and production-quality assurance.',
    memberIds: [
      'argam-torozyan',
      'harutyun-navasardyan',
      'zori-sargsyan'
    ]
  },
  {
    id: 'backend-fullstack-blockchain',
    title: 'Backend, Full-Stack & Blockchain',
    description:
        'Backend platforms, Web3 infrastructure, enterprise systems and complete product development.',
    memberIds: [
      'emil-hambardzumyan',
      'artur-kamalyan',
      'taron-gevorgyan',
      'armen-arakelyan'
    ]
  }
]

const teamGroups = teamGroupDefinitions.map((group) => ({
  ...group,
  members: group.memberIds
      .map((memberId) => team.find((member) => member.id === memberId))
      .filter(Boolean)
}))


const selectedMember = ref(null)
const mobileMenuOpen = ref(false)
const profileModal = ref(null)
let lastFocusedElement = null

const products = [
  {
    number: '01',
    title: 'Custody Infrastructure',
    description: 'Multi-chain wallets, transaction processing, scanners, webhooks and approval workflows for digital-asset products.',
    tags: ['.NET', 'Vue.js', 'Multichain integration'],
    url: 'https://custody.deneon.net',
    icon: 'vault'
  },
  {
    number: '02',
    title: 'DEX & Wallet',
    description: 'A non-custodial Web3 experience with assets, swaps, real-time pricing and secure transaction flows.',
    tags: ['Vue.js', 'FastAPI', 'Web3'],
    url: 'https://deneon.net',
    icon: 'wallet'
  },
  {
    number: '03',
    title: 'GameFi',
    description: 'Game-first onboarding, Telegram Mini Apps, rewards and wallet mechanics in one connected experience.',
    tags: ['GameFi', 'Telegram', 'Realtime'],
    url: 'https://mini.app.deneon.net',
    icon: 'game'
  }
]

const capabilities = [
  { label: 'Backend', icon: 'database' },
  { label: 'Web', icon: 'globe' },
  { label: 'Mobile', icon: 'mobile' },
  { label: 'QA', icon: 'shield' },
  { label: 'Blockchain', icon: 'cube' }
]

function openProfile(member) {
  if (document.activeElement instanceof HTMLElement) lastFocusedElement = document.activeElement
  selectedMember.value = member
}

function closeProfile() {
  selectedMember.value = null
}

function handleMemberImageError(event, member) {
  const image = event.currentTarget
  if (!member.imageFallback || image.dataset.fallbackApplied) return
  image.dataset.fallbackApplied = 'true'
  image.src = member.imageFallback
}

function onKeydown(event) {
  if (event.key === 'Escape') closeProfile()
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return
  const focusable = [...event.currentTarget.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(selectedMember, async (member) => {
  document.body.classList.toggle('modal-open', Boolean(member))
  await nextTick()
  if (member) profileModal.value?.querySelector('.modal-close')?.focus()
  else lastFocusedElement?.focus()
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <div class="site-shell">
    <header class="header">
      <a class="brand" href="#top" aria-label="DENeon Team home">
        <img style="width: 40px;" src="https://i.imgur.com/vpNOEYX.png" alt="">
        <span class="brand-name">DENeon <b>Team</b></span>
      </a>

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle navigation"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span></span><span></span>
      </button>

      <nav :class="['nav', { 'nav--open': mobileMenuOpen }]" aria-label="Main navigation">
        <a href="#expertise" @click="mobileMenuOpen = false">Expertise</a>
        <a href="#work" @click="mobileMenuOpen = false">Work</a>
        <a href="#team" @click="mobileMenuOpen = false">Team</a>
        <a href="#contact" @click="mobileMenuOpen = false">Contact</a>
      </nav>

      <a class="button button--small button--outline desktop-cta" href="mailto:deneonofficial@gmail.com">Discuss a project</a>
    </header>

    <main id="top">
      <section class="hero section-grid">
        <div class="hero-copy reveal">
          <p class="eyebrow"><span></span> Product engineering team</p>
          <h1>A product team,<br /><em>ready to build.</em></h1>
          <p class="hero-text">
            Backend, frontend, mobile, QA and blockchain specialists building secure, scalable digital products — from architecture to production.
          </p>
          <div class="hero-actions">
            <a class="button button--primary" href="#team">Meet the team <span>→</span></a>
            <a class="button button--outline" href="#work">View our work <span>↘</span></a>
          </div>
        </div>

        <svg
            viewBox="0 0 760 560"
            width="100%"
            height="auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby="deneon-team-title deneon-team-description"
        >
          <title id="deneon-team-title">DENeon product team</title>

          <desc id="deneon-team-description">
            Backend, web, mobile, QA and blockchain specialists working together.
          </desc>

          <defs>
            <radialGradient id="team-background" cx="50%" cy="48%" r="52%">
              <stop offset="0" stop-color="#168FE8" stop-opacity=".16"/>
              <stop offset=".52" stop-color="#21D4E8" stop-opacity=".05"/>
              <stop offset="1" stop-color="#020914" stop-opacity="0"/>
            </radialGradient>

            <linearGradient id="team-primary" x1="240" y1="130" x2="530" y2="450">
              <stop stop-color="#30ECF4"/>
              <stop offset=".52" stop-color="#168FE8"/>
              <stop offset="1" stop-color="#19B9B0"/>
            </linearGradient>

            <linearGradient id="team-panel" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#0C1928"/>
              <stop offset="1" stop-color="#06101D"/>
            </linearGradient>

            <filter id="team-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur"/>

              <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="
          0 0 0 0 0.129
          0 0 0 0 0.831
          0 0 0 0 0.910
          0 0 0 .65 0
        "
              />

              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="team-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                  dx="0"
                  dy="14"
                  stdDeviation="18"
                  flood-color="#000814"
                  flood-opacity=".55"
              />
            </filter>

            <pattern
                id="team-grid"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
            >
              <path
                  d="M28 0H0V28"
                  stroke="#21D4E8"
                  stroke-opacity=".055"
              />
            </pattern>
          </defs>

          <!-- Background -->
          <rect
              width="760"
              height="560"
              rx="28"
              fill="#020914"
          />

          <rect
              width="760"
              height="560"
              rx="28"
              fill="url(#team-grid)"
          />

          <ellipse
              cx="380"
              cy="280"
              rx="330"
              ry="250"
              fill="url(#team-background)"
          />

          <!-- Orbits -->
          <ellipse
              cx="380"
              cy="282"
              rx="276"
              ry="188"
              stroke="#21D4E8"
              stroke-opacity=".2"
              stroke-dasharray="5 9"
          />

          <ellipse
              cx="380"
              cy="282"
              rx="200"
              ry="137"
              stroke="#168FE8"
              stroke-opacity=".22"
          />

          <circle
              cx="380"
              cy="282"
              r="92"
              stroke="#21D4E8"
              stroke-opacity=".18"
          />

          <!-- Connection lines -->
          <g
              stroke="url(#team-primary)"
              stroke-width="1.4"
              stroke-opacity=".55"
          >
            <path d="M380 190V118"/>
            <path d="M298 238L202 188"/>
            <path d="M462 238L558 188"/>
            <path d="M313 345L220 414"/>
            <path d="M447 345L540 414"/>
          </g>

          <!-- Connection points -->
          <g fill="#21D4E8" filter="url(#team-glow)">
            <circle cx="380" cy="190" r="3"/>
            <circle cx="298" cy="238" r="3"/>
            <circle cx="462" cy="238" r="3"/>
            <circle cx="313" cy="345" r="3"/>
            <circle cx="447" cy="345" r="3"/>
          </g>

          <!-- Animated signal particles -->
          <g fill="#30ECF4" filter="url(#team-glow)">
            <circle r="4">
              <animateMotion
                  dur="3.4s"
                  repeatCount="indefinite"
                  path="M380 190V118"
              />
            </circle>

            <circle r="4">
              <animateMotion
                  dur="4.1s"
                  repeatCount="indefinite"
                  path="M298 238L202 188"
              />
            </circle>

            <circle r="4">
              <animateMotion
                  dur="3.7s"
                  repeatCount="indefinite"
                  path="M462 238L558 188"
              />
            </circle>

            <circle r="4">
              <animateMotion
                  dur="4.4s"
                  repeatCount="indefinite"
                  path="M313 345L220 414"
              />
            </circle>

            <circle r="4">
              <animateMotion
                  dur="3.9s"
                  repeatCount="indefinite"
                  path="M447 345L540 414"
              />
            </circle>
          </g>

          <!-- Central team core -->
          <g filter="url(#team-soft-shadow)">
            <circle
                cx="380"
                cy="282"
                r="76"
                fill="#071522"
            />

            <circle
                cx="380"
                cy="282"
                r="75"
                stroke="url(#team-primary)"
                stroke-width="2"
            />

            <circle
                cx="380"
                cy="282"
                r="61"
                fill="#091D2C"
                stroke="#21D4E8"
                stroke-opacity=".25"
            />

            <circle
                cx="380"
                cy="282"
                r="51"
                fill="#071522"
                stroke="#168FE8"
                stroke-opacity=".2"
            />

            <!-- Person on the left -->
            <g
                stroke="#19B9B0"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
              <circle
                  cx="353"
                  cy="269"
                  r="10"
                  fill="#071522"
              />

              <path
                  d="M335 306V301C335 289.95 343.95 281 355 281H357"
              />
            </g>

            <!-- Person on the right -->
            <g
                stroke="#168FE8"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
              <circle
                  cx="407"
                  cy="269"
                  r="10"
                  fill="#071522"
              />

              <path
                  d="M403 281H405C416.05 281 425 289.95 425 301V306"
              />
            </g>

            <!-- Central person -->
            <g
                stroke="#30ECF4"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                filter="url(#team-glow)"
            >
              <circle
                  cx="380"
                  cy="257"
                  r="13"
                  fill="#071522"
              />

              <path
                  d="M354 310V304C354 289.64 365.64 278 380 278C394.36 278 406 289.64 406 304V310"
              />
            </g>

            <!-- Cooperation line -->
            <path
                d="M340 311H420"
                stroke="url(#team-primary)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-opacity=".8"
            />

            <circle
                cx="380"
                cy="311"
                r="3"
                fill="#30ECF4"
                filter="url(#team-glow)"
            />

            <text
                x="380"
                y="359"
                fill="#91A7B9"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="10"
                font-weight="700"
                letter-spacing="2"
                text-anchor="middle"
            >
            </text>
          </g>

          <!-- Backend -->
          <g
              transform="translate(380 84)"
              filter="url(#team-soft-shadow)"
          >
            <circle
                r="47"
                fill="url(#team-panel)"
                stroke="#21D4E8"
                stroke-opacity=".7"
            />

            <circle
                r="37"
                fill="#071522"
                stroke="#168FE8"
                stroke-opacity=".35"
            />

            <g
                stroke="#30ECF4"
                stroke-width="2"
                stroke-linecap="round"
            >
              <ellipse cy="-10" rx="16" ry="7"/>

              <path
                  d="M-16-10V1C-16 5-9 8 0 8S16 5 16 1V-10"
              />

              <path
                  d="M-16 1V12C-16 16-9 19 0 19S16 16 16 12V1"
              />
            </g>

            <text
                y="66"
                fill="#91DCE8"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="12"
                font-weight="600"
                text-anchor="middle"
            >
              Backend
            </text>
          </g>

          <!-- Web -->
          <g
              transform="translate(166 170)"
              filter="url(#team-soft-shadow)"
          >
            <circle
                r="47"
                fill="url(#team-panel)"
                stroke="#21D4E8"
                stroke-opacity=".7"
            />

            <circle
                r="37"
                fill="#071522"
                stroke="#19B9B0"
                stroke-opacity=".4"
            />

            <g
                stroke="#30ECF4"
                stroke-width="2"
                stroke-linecap="round"
            >
              <circle r="19"/>
              <path d="M-19 0H19"/>
              <path d="M0-19C7-12 7 12 0 19"/>
              <path d="M0-19C-7-12-7 12 0 19"/>
            </g>

            <text
                y="66"
                fill="#91DCE8"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="12"
                font-weight="600"
                text-anchor="middle"
            >
              Web
            </text>
          </g>

          <!-- Mobile -->
          <g
              transform="translate(594 170)"
              filter="url(#team-soft-shadow)"
          >
            <circle
                r="47"
                fill="url(#team-panel)"
                stroke="#168FE8"
                stroke-opacity=".8"
            />

            <circle
                r="37"
                fill="#071522"
                stroke="#168FE8"
                stroke-opacity=".4"
            />

            <g
                stroke="#63B9FF"
                stroke-width="2"
                stroke-linecap="round"
            >
              <rect
                  x="-13"
                  y="-22"
                  width="26"
                  height="44"
                  rx="5"
              />

              <path d="M-5-16H5"/>
              <path d="M-3 16H3"/>
            </g>

            <text
                y="66"
                fill="#91BFFF"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="12"
                font-weight="600"
                text-anchor="middle"
            >
              Mobile
            </text>
          </g>

          <!-- QA -->
          <g
              transform="translate(185 432)"
              filter="url(#team-soft-shadow)"
          >
            <circle
                r="47"
                fill="url(#team-panel)"
                stroke="#19B9B0"
                stroke-opacity=".8"
            />

            <circle
                r="37"
                fill="#071522"
                stroke="#19B9B0"
                stroke-opacity=".4"
            />

            <g
                stroke="#42E5D5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
              <path
                  d="M0-22L18-15V-2C18 9 10 18 0 22C-10 18-18 9-18-2V-15L0-22Z"
              />

              <path d="M-8 0L-2 6L10-7"/>
            </g>

            <text
                y="66"
                fill="#8FEADD"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="12"
                font-weight="600"
                text-anchor="middle"
            >
              QA
            </text>
          </g>

          <!-- Blockchain -->
          <g
              transform="translate(575 432)"
              filter="url(#team-soft-shadow)"
          >
            <circle
                r="47"
                fill="url(#team-panel)"
                stroke="#21D4E8"
                stroke-opacity=".75"
            />

            <circle
                r="37"
                fill="#071522"
                stroke="#21D4E8"
                stroke-opacity=".4"
            />

            <g
                stroke="#30ECF4"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
              <path
                  d="M0-22L19-11V11L0 22L-19 11V-11L0-22Z"
              />

              <path d="M-19-11L0 0L19-11"/>
              <path d="M0 0V22"/>
              <path d="M0-22V0"/>
            </g>

            <text
                y="66"
                fill="#91DCE8"
                font-family="Manrope, Inter, Arial, sans-serif"
                font-size="12"
                font-weight="600"
                text-anchor="middle"
            >
              Blockchain
            </text>
          </g>

          <!-- Decorative particles -->
          <g fill="#30ECF4">
            <circle cx="92" cy="278" r="2" opacity=".8"/>
            <circle cx="672" cy="276" r="2" opacity=".7"/>
            <circle cx="292" cy="92" r="2" opacity=".65"/>
            <circle cx="478" cy="101" r="2" opacity=".55"/>
            <circle cx="290" cy="475" r="2" opacity=".6"/>
            <circle cx="470" cy="475" r="2" opacity=".7"/>
          </g>

          <!-- Decorative corner lines -->
          <g
              stroke="#21D4E8"
              stroke-opacity=".18"
              stroke-width="1"
          >
            <path d="M28 74V28H74"/>
            <path d="M686 28H732V74"/>
            <path d="M28 486V532H74"/>
            <path d="M686 532H732V486"/>
          </g>
        </svg>
      </section>

      <section id="expertise" class="proof-strip">
        <div><span class="proof-icon">◇</span><strong>One team</strong><small>Aligned from day one</small></div>
        <div><span class="proof-icon">▱</span><strong>Full product cycle</strong><small>From idea to production</small></div>
        <div><span class="proof-icon">↗</span><strong>Production experience</strong><small>Built through real products</small></div>
      </section>

      <section id="work" class="section work-section">
        <div class="section-heading">
          <div><p class="eyebrow"><span></span> Selected work</p><h2>DENeon Ecosystem</h2></div>
          <p>Our own products demonstrate how we approach architecture, security, UX and delivery.</p>
        </div>

        <div class="product-grid">
          <article v-for="product in products" :key="product.title" class="product-card">
            <div class="product-top"><span>{{ product.number }}</span><span class="product-line"></span></div>
            <div :class="['product-visual', `product-visual--${product.icon}`]">
              <div class="visual-grid"></div>
              <svg v-if="product.icon === 'vault'" viewBox="0 0 120 100"><rect x="24" y="14" width="72" height="72" rx="8"/><circle cx="60" cy="50" r="20"/><circle cx="60" cy="50" r="5"/><path d="M60 30v15M80 50H65M60 70V55M40 50h15M91 30h9M91 70h9"/></svg>
              <svg v-else-if="product.icon === 'wallet'" viewBox="0 0 120 100"><rect x="20" y="22" width="80" height="58" rx="10"/><path d="M20 38h80M75 48h31v20H75a10 10 0 0 1 0-20Z"/><circle cx="86" cy="58" r="3"/></svg>
              <svg v-else viewBox="0 0 120 100"><path d="M27 43 40 28h40l13 15 9 31c2 8-8 13-14 7L73 67H47L32 81c-6 6-16 1-14-7l9-31Z"/><path d="M43 44v20M33 54h20M76 48h.1M87 59h.1"/></svg>
            </div>
            <h3>{{ product.title }}</h3>
            <p>{{ product.description }}</p>
            <div class="tag-list"><span v-for="tag in product.tags" :key="tag">{{ tag }}</span></div>
            <a :href="product.url" target="_blank" rel="noopener">View product <span>→</span></a>
          </article>
        </div>
      </section>

      <section id="team" class="section team-section">
        <div class="section-heading">
          <div><p class="eyebrow"><span></span> Team</p><h2>The people behind the product</h2></div>
          <p>A focused team of specialists assembled around the needs of each product.</p>
        </div>
        <div class="team-groups">
          <section
              v-for="group in teamGroups"
              :key="group.id"
              class="team-group"
              :class="`team-group--size-${group.members.length}`"
          >
            <div class="team-group-heading">
              <div class="team-group-title">
                <span class="team-group-marker"></span>
                <h3>{{ group.title }}</h3>
              </div>

              <p>{{ group.description }}</p>
            </div>

            <div class="team-grid">
              <article
                  v-for="member in group.members"
                  :key="member.id"
                  class="member-card"
                  role="button"
                  tabindex="0"
                  :aria-label="`View ${member.name} profile`"
                  @click="openProfile(member)"
                  @keydown.enter.self="openProfile(member)"
                  @keydown.space.prevent.self="openProfile(member)"
              >
                <div class="member-image">
                  <img
                      :src="member.image"
                      :alt="member.imageAlt || member.name"
                      loading="lazy"
                      @error="handleMemberImageError($event, member)"
                  />
                </div>

                <div class="member-content">
                  <p class="member-role">{{ member.role }}</p>

                  <h3>{{ member.name }}</h3>

                  <p>{{ member.summary }}</p>

                  <div v-if="member.tags?.length" class="member-tags">
            <span
                v-for="tag in member.tags"
                :key="tag"
            >
              {{ tag }}
            </span>
                  </div>

                  <button
                      type="button"
                      @click.stop="openProfile(member)"
                  >
                    View profile <span>→</span>
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>

<!--        <div class="team-grid">-->
<!--          <article v-for="member in team" :key="member.id" class="member-card" role="button" tabindex="0" :aria-label="`View ${member.name} profile`" @click="openProfile(member)" @keydown.enter.self="openProfile(member)" @keydown.space.prevent.self="openProfile(member)">-->
<!--            <div class="member-image"><img :src="member.image" :alt="member.imageAlt || member.name" loading="lazy" @error="handleMemberImageError($event, member)" /></div>-->
<!--            <div class="member-content">-->
<!--              <p class="member-role">{{ member.role }}</p>-->
<!--              <h3>{{ member.name }}</h3>-->
<!--              <p>{{ member.summary }}</p>-->
<!--              <div v-if="member.tags?.length" class="member-tags"><span v-for="tag in member.tags" :key="tag">{{ tag }}</span></div>-->
<!--              <button type="button" @click.stop="openProfile(member)">View profile <span>→</span></button>-->
<!--            </div>-->
<!--          </article>-->

<!--&lt;!&ndash;          <div class="team-placeholder">&ndash;&gt;-->
<!--&lt;!&ndash;            <span>+</span>&ndash;&gt;-->
<!--&lt;!&ndash;            <div><strong>More specialists coming soon</strong><small>Team profiles will be added from verified CVs.</small></div>&ndash;&gt;-->
<!--&lt;!&ndash;          </div>&ndash;&gt;-->
<!--        </div>-->
      </section>

      <section class="section process-section">
        <div class="section-heading">
          <div><p class="eyebrow"><span></span> How we work</p><h2>One process. Clear ownership.</h2></div>
        </div>
        <div class="process-grid">
          <div><span>01</span><h3>Understand</h3><p>We clarify the product, users, constraints and measurable outcome.</p></div>
          <div><span>02</span><h3>Design</h3><p>We shape architecture, interfaces and an achievable delivery plan.</p></div>
          <div><span>03</span><h3>Build</h3><p>We develop in visible iterations with testing integrated into delivery.</p></div>
          <div><span>04</span><h3>Deliver</h3><p>We launch, monitor and continue improving the production product.</p></div>
        </div>
      </section>

      <section id="contact" class="contact-section">
        <div class="contact-glow"></div>
        <p class="eyebrow eyebrow--center"><span></span> Start a conversation <span></span></p>
        <h2>Have a product in mind?</h2>
        <p>Tell us what you are building. We will help turn it into a clear, deliverable product.</p>
        <a class="button button--primary" href="mailto:deneonofficial@gmail.com">Discuss your project <span>→</span></a>
      </section>
    </main>

    <footer class="footer">
      <a class="brand" href="#top"><img style="width: 40px;" src="https://i.imgur.com/vpNOEYX.png" alt=""><span class="brand-name">DENeon <b>Team</b></span></a>
      <p>Product engineering across web, mobile and blockchain.</p>
      <span>© {{ new Date().getFullYear() }} DENeon</span>
    </footer>

    <Transition name="modal">
      <div v-if="selectedMember" class="modal-backdrop" role="presentation" @mousedown.self="closeProfile">
        <section ref="profileModal" class="profile-modal" role="dialog" aria-modal="true" :aria-labelledby="`${selectedMember.id}-profile-title`" tabindex="-1" @keydown="trapModalFocus">
          <button class="modal-close" type="button" aria-label="Close profile" @click="closeProfile">×</button>
          <div class="profile-header">
            <img :src="selectedMember.image" :alt="selectedMember.imageAlt || selectedMember.name" @error="handleMemberImageError($event, selectedMember)" />
            <div><p class="member-role">{{ selectedMember.role }}</p><h2 :id="`${selectedMember.id}-profile-title`">{{ selectedMember.name }}</h2><p>{{ selectedMember.summary }}</p></div>
          </div>
          <div class="profile-body">
            <div class="profile-main">
              <section><h3>About</h3><template v-if="selectedMember.aboutParagraphs?.length"><p v-for="paragraph in selectedMember.aboutParagraphs" :key="paragraph">{{ paragraph }}</p></template><p v-else>{{ selectedMember.about }}</p></section>
              <section v-if="selectedMember.experience?.length"><h3>Experience</h3><div class="timeline">
                <div v-for="item in selectedMember.experience" :key="item.period + item.company" class="timeline-item">
                  <span>{{ item.period }}</span><div><h4 v-if="item.position">{{ item.position }}</h4><strong>{{ item.company }}</strong><div v-if="item.roles?.length" class="timeline-roles"><div v-for="role in item.roles" :key="role.position + role.period"><h4>{{ role.position }}</h4><span>{{ role.period }}</span></div></div><p v-if="item.note" class="timeline-note">{{ item.note }}</p><p v-if="item.description">{{ item.description }}</p><ul v-if="item.responsibilities?.length" class="timeline-responsibilities"><li v-for="responsibility in item.responsibilities" :key="responsibility">{{ responsibility }}</li></ul></div>
                </div>
              </div></section>
              <section v-if="selectedMember.additionalExperience?.length"><h3>{{ selectedMember.additionalExperienceTitle || 'Additional experience' }}</h3><div class="profile-education">
                <article v-for="item in selectedMember.additionalExperience" :key="item.position + item.institution">
                  <span>{{ item.period }}</span><div><h4>{{ item.position }}</h4><strong>{{ item.institution }}</strong><p v-if="item.description">{{ item.description }}</p></div>
                </article>
              </div></section>
              <section v-if="selectedMember.portfolio?.length"><h3>Selected application portfolio</h3><div class="profile-portfolio"><span v-for="application in selectedMember.portfolio" :key="application">{{ application }}</span></div></section>
              <section v-if="selectedMember.education?.length"><h3>Education</h3><div class="profile-education">
                <article v-for="item in selectedMember.education" :key="item.degree + item.institution">
                  <span>{{ item.period }}</span><div><h4>{{ item.degree }}</h4><strong>{{ item.institution }}</strong><p v-if="item.location">{{ item.location }}</p></div>
                </article>
              </div></section>
              <section v-if="selectedMember.training?.length"><h3>Additional training</h3><div class="profile-education">
                <article v-for="item in selectedMember.training" :key="item.program + item.institution">
                  <span>{{ item.period }}</span><div><h4>{{ item.program }}</h4><strong>{{ item.institution }}</strong><div v-if="item.skills?.length" class="tag-list tag-list--profile training-tags"><span v-for="skill in item.skills" :key="skill">{{ skill }}</span></div></div>
                </article>
              </div></section>
              <section v-if="selectedMember.projects?.length"><h3>Selected projects</h3><div class="profile-projects">
                <a v-for="project in selectedMember.projects" :key="project.name" :href="project.url" target="_blank" rel="noopener noreferrer"><span>↗</span><div><strong>{{ project.name }}</strong><small>{{ project.description }}</small><div v-if="project.tags?.length" class="tag-list tag-list--profile project-tags"><span v-for="tag in project.tags" :key="tag">{{ tag }}</span></div></div></a>
              </div></section>
              <section v-if="selectedMember.selectedExperience?.length"><h3>{{ selectedMember.selectedExperienceTitle || 'Selected experience' }}</h3><div class="profile-projects">
                <article v-for="item in selectedMember.selectedExperience" :key="item.name" class="profile-project"><span>◇</span><div><strong>{{ item.name }}</strong><small>{{ item.description }}</small></div></article>
              </div></section>
            </div>
            <aside class="profile-aside">
              <section v-if="selectedMember.technologies?.length"><h3>{{ selectedMember.technologiesTitle || 'Expertise' }}</h3><div class="tag-list tag-list--profile"><span v-for="technology in selectedMember.technologies" :key="technology">{{ technology }}</span></div></section>
              <section v-if="selectedMember.expertiseGroups?.length"><h3>Expertise</h3><div class="expertise-groups">
                <div v-for="group in selectedMember.expertiseGroups" :key="group.name" class="expertise-group"><h4>{{ group.name }}</h4><div class="tag-list tag-list--profile"><span v-for="skill in group.skills" :key="skill">{{ skill }}</span></div></div>
              </div></section>
              <section v-if="selectedMember.languages?.length"><h3>Languages</h3><ul><li v-for="language in selectedMember.languages" :key="language">{{ language }}</li></ul></section>
              <section v-if="selectedMember.github || selectedMember.linkedin || selectedMember.contactEmail || selectedMember.cvUrl"><h3>Links</h3><div class="profile-links"><a v-if="selectedMember.github" :href="selectedMember.github" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a v-if="selectedMember.linkedin" :href="selectedMember.linkedin" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a v-if="selectedMember.contactEmail" :href="`mailto:${selectedMember.contactEmail}`">Email</a><a v-if="selectedMember.cvUrl" :href="selectedMember.cvUrl" target="_blank" rel="noopener noreferrer">Download CV</a></div></section>
<!--              <a v-if="selectedMember.resume" class="button button&#45;&#45;primary button&#45;&#45;full" :href="selectedMember.resume" target="_blank" rel="noopener noreferrer">{{ selectedMember.resumeLabel || 'View full resume' }} <span>↗</span></a>-->
            </aside>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>
