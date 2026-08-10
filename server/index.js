import { createApiApp } from './app.js'

const port = Number(process.env.PORT || 8080)
const server = createApiApp().listen(port, '0.0.0.0', () => {
  console.log(`DENeon contact API listening on port ${port}`)
})

function shutdown() { server.close(() => process.exit(0)) }
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
