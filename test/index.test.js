const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { plugin } = require('../lib')
const { MongoClient, ObjectId } = require('mongodb')
const { MongoMemoryServer } = require('mongodb-memory-server')

const { describe, it, beforeEach, afterEach, before, after } = (exports.lab = Lab.script())
const { expect } = Code

const mockedUsers = [
  { _id: new ObjectId(123), name: 'John', email: 'john@example.com' },
  { _id: new ObjectId(456), name: 'Jones', email: 'jones@example.com' }
]

describe('mongocruise - plugin', () => {
  let db
  let mongoClient
  let mongoServer
  let serverMock

  before(async () => {
    mongoServer = await MongoMemoryServer.create()
    mongoClient = await MongoClient.connect(mongoServer.getUri(), {})
    db = mongoClient.db(mongoServer.instanceInfo.dbName)
  })

  beforeEach(async () => {
    await db.collection('users').insertMany([...mockedUsers])

    serverMock = {
      mongo: {
        db,
        ObjectId
      },
      decorate: Sinon.stub()
    }
  })

  afterEach(async () => {
    await db.collection('users').drop()
    Sinon.restore()
  })

  after(async () => {
    if (mongoClient) await mongoClient.close()
    if (mongoServer) await mongoServer.stop()
  })

  it('registers correctly', () => {
    plugin.register(serverMock)
    expect(serverMock.decorate.calledOnce).to.be.true()
  })

  it('correctly calls the find operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'find'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ query: {} }, serverMock)

    expect(result).to.be.an.array()
    expect(result.length).to.equal(2)
    expect(result[0].name).to.equal('John')
  })

  it('correctly calls the findOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'findOne',
      queryParam: '_id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[0]._id } }, handlerOptions)
    const result = await handler({ params: { _id: mockedUsers[0]._id } }, serverMock)

    expect(result).to.be.an.object()
    expect(result.name).to.equal('John')
  })

  it('correctly calls the findOne operation with a projection', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'findOne',
      queryParam: '_id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[0]._id } }, handlerOptions)
    const result = await handler(
      { params: { _id: mockedUsers[0]._id }, query: { projection: JSON.stringify({ _id: true }) } },
      serverMock
    )

    expect(result).to.be.an.object()
    expect(result.name).to.not.exist()
  })

  it('correctly calls the insertOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'insertOne'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ payload: { name: 'Anderson' } }, serverMock)

    expect(result).to.be.an.object()
    expect(result.name).to.equal('Anderson')
  })

  it('adds createdAt and updatedAt on the insertOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'insertOne'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ payload: { name: 'Leila' } }, serverMock)

    expect(result).to.be.an.object()
    expect(Object.keys(result)).to.equal(['_id', 'name', 'createdAt', 'updatedAt'])
  })

  it('omits createdAt and updatedAt on the insertOne operation if setTimestamps is set to false', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'insertOne',
      setTimestamps: false
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ payload: { name: 'John' } }, serverMock)

    expect(result).to.be.an.object()
    expect(Object.keys(result)).to.equal(['_id', 'name'])
  })

  it('correctly calls the updateOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: '_id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[0]._id } }, handlerOptions)
    const result = await handler({ params: { _id: mockedUsers[0]._id }, payload: { name: 'Updated John' } }, serverMock)

    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)
  })

  it('adds updatedAt on the updateOne operation', async () => {
    const updateHandlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: '_id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[0]._id } }, updateHandlerOptions)
    const result = await handler({ params: { _id: mockedUsers[0]._id }, payload: { name: 'New Name' } }, serverMock)

    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)

    const updatedDocument = await db.collection('users').findOne({ name: 'New Name' })
    expect(updatedDocument).to.be.an.object()
    expect(updatedDocument.updatedAt).to.exist()
  })

  it('omits updatedAt on the updateOne operation if setTimestamps is set to false', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: '_id',
      setTimestamps: false
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[0]._id } }, handlerOptions)
    const result = await handler({ params: { _id: mockedUsers[0]._id }, payload: { name: 'Omitted' } }, serverMock)

    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)

    const updatedDocument = await db.collection('users').findOne({ _id: mockedUsers[0]._id })

    expect(updatedDocument).to.be.an.object()
    expect(updatedDocument.updatedAt).to.not.exist()
  })

  it('correctly calls the deleteOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'deleteOne',
      queryParam: '_id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { _id: mockedUsers[1]._id } }, handlerOptions)
    const result = await handler({ params: { _id: mockedUsers[1]._id } }, serverMock)

    expect(result.acknowledged).to.be.true()
    expect(result.deletedCount).to.be.greaterThan(0)
  })

  it('throws an error for invalid query', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'find'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)

    try {
      await handler({ query: { find: '{"invalidJson": value}' } }, serverMock)
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
    }
  })

  it('throws an error for invalid findOne query', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'findOne',
      queryParam: 'id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)

    try {
      await handler(
        {
          params: {
            id: '123'
          },
          query: { find: '{"invalidJson": value}' }
        },
        serverMock
      )
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
    }
  })

  it('throws an error for unsupported operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'unsupportedOperation'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)

    try {
      await handler({}, serverMock)
    } catch (error) {
      expect(error.message).to.be.equal('Invaid MongoDB operation passed in: unsupportedOperation')
    }
  })
})
