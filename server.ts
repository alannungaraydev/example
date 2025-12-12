import Fastify from 'fastify'

const server = Fastify({ logger: true })

// Declare a route
server.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})

server.listen({ port: 3000 })
