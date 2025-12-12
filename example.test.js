import Fastify from 'fastify'

// Message interface
const createServer = () => {
  const server = Fastify({ logger: false })

  // Message store
  const messages = new Map()

  // Root route
  server.get('/', async function handler (request, reply) {
    return { hello: 'world' }
  })

  // ID counter to ensure unique IDs
  let idCounter = 0

  // CREATE - POST /messages
  server.post('/messages', async (request, reply) => {
    const { content } = request.body
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      reply.code(400)
      return { error: 'Content is required and must be a non-empty string' }
    }
    
    const id = `${Date.now()}-${idCounter++}`
    const timestamp = new Date().toISOString()
    const message = {
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
  server.get('/messages/:id', async (request, reply) => {
    const { id } = request.params
    const message = messages.get(id)
    
    if (!message) {
      reply.code(404)
      return { error: 'Message not found' }
    }
    
    return message
  })

  // UPDATE - PUT /messages/:id
  server.put('/messages/:id', async (request, reply) => {
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
    
    const updatedMessage = {
      ...message,
      content,
      updatedAt: new Date().toISOString()
    }
    
    messages.set(id, updatedMessage)
    return updatedMessage
  })

  // DELETE - DELETE /messages/:id
  server.delete('/messages/:id', async (request, reply) => {
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

  return server
}

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`)
  }
}

// Run tests
const runTests = async () => {
  console.log('Starting tests...\n')
  let passedTests = 0
  let failedTests = 0

  // Test 1: POST /messages - Create a message
  try {
    const server = createServer()
    const response = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'Hello, World!' }
    })
    
    assertEqual(response.statusCode, 201, 'POST /messages should return 201')
    const body = JSON.parse(response.body)
    assert(body.id, 'Response should have an id')
    assertEqual(body.content, 'Hello, World!', 'Content should match')
    assert(body.createdAt, 'Response should have createdAt')
    assert(body.updatedAt, 'Response should have updatedAt')
    
    console.log('✓ Test 1: POST /messages - Create a message')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 1: POST /messages - Create a message')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 2: POST /messages - Validation (empty content)
  try {
    const server = createServer()
    const response = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: '' }
    })
    
    assertEqual(response.statusCode, 400, 'POST /messages with empty content should return 400')
    const body = JSON.parse(response.body)
    assert(body.error, 'Response should have an error message')
    
    console.log('✓ Test 2: POST /messages - Validation (empty content)')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 2: POST /messages - Validation (empty content)')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 3: GET /messages - Read all messages
  try {
    const server = createServer()
    
    // Create two messages
    await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'First message' }
    })
    await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'Second message' }
    })
    
    const response = await server.inject({
      method: 'GET',
      url: '/messages'
    })
    
    assertEqual(response.statusCode, 200, 'GET /messages should return 200')
    const body = JSON.parse(response.body)
    assert(Array.isArray(body), 'Response should be an array')
    assertEqual(body.length, 2, 'Should return 2 messages')
    
    console.log('✓ Test 3: GET /messages - Read all messages')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 3: GET /messages - Read all messages')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 4: GET /messages/:id - Read one message
  try {
    const server = createServer()
    
    // Create a message
    const createResponse = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'Test message' }
    })
    const createdMessage = JSON.parse(createResponse.body)
    
    const response = await server.inject({
      method: 'GET',
      url: `/messages/${createdMessage.id}`
    })
    
    assertEqual(response.statusCode, 200, 'GET /messages/:id should return 200')
    const body = JSON.parse(response.body)
    assertEqual(body.id, createdMessage.id, 'Should return the correct message')
    assertEqual(body.content, 'Test message', 'Content should match')
    
    console.log('✓ Test 4: GET /messages/:id - Read one message')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 4: GET /messages/:id - Read one message')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 5: GET /messages/:id - Not found
  try {
    const server = createServer()
    const response = await server.inject({
      method: 'GET',
      url: '/messages/nonexistent'
    })
    
    assertEqual(response.statusCode, 404, 'GET /messages/:id with invalid id should return 404')
    const body = JSON.parse(response.body)
    assert(body.error, 'Response should have an error message')
    
    console.log('✓ Test 5: GET /messages/:id - Not found')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 5: GET /messages/:id - Not found')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 6: PUT /messages/:id - Update a message
  try {
    const server = createServer()
    
    // Create a message
    const createResponse = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'Original content' }
    })
    const createdMessage = JSON.parse(createResponse.body)
    
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Update the message
    const response = await server.inject({
      method: 'PUT',
      url: `/messages/${createdMessage.id}`,
      payload: { content: 'Updated content' }
    })
    
    assertEqual(response.statusCode, 200, 'PUT /messages/:id should return 200')
    const body = JSON.parse(response.body)
    assertEqual(body.content, 'Updated content', 'Content should be updated')
    assertEqual(body.id, createdMessage.id, 'ID should remain the same')
    assert(body.updatedAt !== createdMessage.updatedAt, 'updatedAt should be different')
    
    console.log('✓ Test 6: PUT /messages/:id - Update a message')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 6: PUT /messages/:id - Update a message')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 7: PUT /messages/:id - Not found
  try {
    const server = createServer()
    const response = await server.inject({
      method: 'PUT',
      url: '/messages/nonexistent',
      payload: { content: 'Updated content' }
    })
    
    assertEqual(response.statusCode, 404, 'PUT /messages/:id with invalid id should return 404')
    const body = JSON.parse(response.body)
    assert(body.error, 'Response should have an error message')
    
    console.log('✓ Test 7: PUT /messages/:id - Not found')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 7: PUT /messages/:id - Not found')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 8: PUT /messages/:id - Validation (empty content)
  try {
    const server = createServer()
    
    // Create a message
    const createResponse = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'Original content' }
    })
    const createdMessage = JSON.parse(createResponse.body)
    
    const response = await server.inject({
      method: 'PUT',
      url: `/messages/${createdMessage.id}`,
      payload: { content: '' }
    })
    
    assertEqual(response.statusCode, 400, 'PUT /messages/:id with empty content should return 400')
    const body = JSON.parse(response.body)
    assert(body.error, 'Response should have an error message')
    
    console.log('✓ Test 8: PUT /messages/:id - Validation (empty content)')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 8: PUT /messages/:id - Validation (empty content)')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 9: DELETE /messages/:id - Delete a message
  try {
    const server = createServer()
    
    // Create a message
    const createResponse = await server.inject({
      method: 'POST',
      url: '/messages',
      payload: { content: 'To be deleted' }
    })
    const createdMessage = JSON.parse(createResponse.body)
    
    // Delete the message
    const response = await server.inject({
      method: 'DELETE',
      url: `/messages/${createdMessage.id}`
    })
    
    assertEqual(response.statusCode, 204, 'DELETE /messages/:id should return 204')
    
    // Verify the message is deleted
    const getResponse = await server.inject({
      method: 'GET',
      url: `/messages/${createdMessage.id}`
    })
    assertEqual(getResponse.statusCode, 404, 'Message should not be found after deletion')
    
    console.log('✓ Test 9: DELETE /messages/:id - Delete a message')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 9: DELETE /messages/:id - Delete a message')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test 10: DELETE /messages/:id - Not found
  try {
    const server = createServer()
    const response = await server.inject({
      method: 'DELETE',
      url: '/messages/nonexistent'
    })
    
    assertEqual(response.statusCode, 404, 'DELETE /messages/:id with invalid id should return 404')
    const body = JSON.parse(response.body)
    assert(body.error, 'Response should have an error message')
    
    console.log('✓ Test 10: DELETE /messages/:id - Not found')
    passedTests++
    await server.close()
  } catch (error) {
    console.log('✗ Test 10: DELETE /messages/:id - Not found')
    console.log('  Error:', error.message)
    failedTests++
  }

  // Test summary
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Tests completed: ${passedTests + failedTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${failedTests}`)
  console.log('='.repeat(50))

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
