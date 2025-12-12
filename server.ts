import Fastify from 'fastify'

const server = Fastify({ logger: true })

// Message interface
interface Message {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

// In-memory data store for messages
const messages: Map<string, Message> = new Map()
let idCounter = 0

// Declare a route
server.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})

// CREATE - POST /messages
server.post<{ Body: { content: string } }>('/messages', async (request, reply) => {
  const { content } = request.body
  
  if (!content || typeof content !== 'string' || content.trim() === '') {
    reply.code(400)
    return { error: 'Content is required and must be a non-empty string' }
  }
  
  const id = `${Date.now()}-${idCounter++}`
  const timestamp = new Date().toISOString()
  const message: Message = {
    id,
    content,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  
  messages.set(id, message)
  reply.code(201)
  return message
})

// READ ALL - GET /messages
server.get('/messages', async (request, reply) => {
  return Array.from(messages.values())
})

// READ ONE - GET /messages/:id
server.get<{ Params: { id: string } }>('/messages/:id', async (request, reply) => {
  const { id } = request.params
  const message = messages.get(id)
  
  if (!message) {
    reply.code(404)
    return { error: 'Message not found' }
  }
  
  return message
})

// UPDATE - PUT /messages/:id
server.put<{ Params: { id: string }, Body: { content: string } }>('/messages/:id', async (request, reply) => {
  const { id } = request.params
  const { content } = request.body
  
  if (!content || typeof content !== 'string' || content.trim() === '') {
    reply.code(400)
    return { error: 'Content is required and must be a non-empty string' }
  }
  
  const message = messages.get(id)
  
  if (!message) {
    reply.code(404)
    return { error: 'Message not found' }
  }
  
  const updatedMessage: Message = {
    ...message,
    content,
    updatedAt: new Date().toISOString()
  }
  
  messages.set(id, updatedMessage)
  return updatedMessage
})

// DELETE - DELETE /messages/:id
server.delete<{ Params: { id: string } }>('/messages/:id', async (request, reply) => {
  const { id } = request.params
  const message = messages.get(id)
  
  if (!message) {
    reply.code(404)
    return { error: 'Message not found' }
  }
  
  messages.delete(id)
  reply.code(204)
  return
})

server.listen({ port: 3000 })
