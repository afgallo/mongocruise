const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { plugin } = require('../lib')
const { runHandlerWith } = require('./helpers')
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
    const result = await runHandlerWith(serverMock, { collection: 'users', operation: 'find' }, { query: {} })

    expect(result).to.be.an.array().and.to.have.length(2)
    expect(result[0].name).to.equal('John')
  })

  it('correctly calls the findOne operation', async () => {
    const userId = mockedUsers[0]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'findOne', queryParam: '_id' },
      { params: { _id: userId } }
    )
    expect(result).to.be.an.object()
    expect(result.name).to.equal('John')
  })

  it('correctly calls the findOne operation with a projection', async () => {
    const userId = mockedUsers[0]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'findOne', queryParam: '_id' },
      { params: { _id: userId }, query: { projection: JSON.stringify({ _id: true }) } }
    )
    expect(result).to.be.an.object()
    expect(result.name).to.not.exist()
  })

  it('correctly calls the insertOne operation', async () => {
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'insertOne' },
      { payload: { name: 'Anderson' } }
    )
    expect(result).to.be.an.object()
    expect(result.name).to.equal('Anderson')
  })

  it('adds createdAt and updatedAt on the insertOne operation', async () => {
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'insertOne' },
      { payload: { name: 'Leila' } }
    )
    expect(result).to.be.an.object()
    expect(Object.keys(result)).to.equal(['_id', 'name', 'createdAt', 'updatedAt'])
  })

  it('omits createdAt and updatedAt on the insertOne operation if setTimestamps is set to false', async () => {
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'insertOne', setTimestamps: false },
      { payload: { name: 'John' } }
    )
    expect(result).to.be.an.object()
    expect(Object.keys(result)).to.equal(['_id', 'name'])
  })

  it('correctly calls the updateOne operation', async () => {
    const userId = mockedUsers[0]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'updateOne', queryParam: '_id' },
      { params: { _id: userId }, payload: { name: 'Updated John' } }
    )
    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)
  })

  it('adds updatedAt on the updateOne operation', async () => {
    const userId = mockedUsers[0]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'updateOne', queryParam: '_id' },
      { params: { _id: userId }, payload: { name: 'New Name' } }
    )
    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)

    const updatedDocument = await db.collection('users').findOne({ name: 'New Name' })
    expect(updatedDocument).to.be.an.object()
    expect(updatedDocument.updatedAt).to.exist()
  })

  it('omits updatedAt on the updateOne operation if setTimestamps is set to false', async () => {
    const userId = mockedUsers[0]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'updateOne', queryParam: '_id', setTimestamps: false },
      { params: { _id: userId }, payload: { name: 'Omitted' } }
    )
    expect(result.acknowledged).to.be.true()
    expect(result.modifiedCount).to.be.greaterThan(0)

    const updatedDocument = await db.collection('users').findOne({ _id: userId })
    expect(updatedDocument).to.be.an.object()
    expect(updatedDocument.updatedAt).to.not.exist()
  })

  it('correctly calls the deleteOne operation', async () => {
    const userId = mockedUsers[1]._id
    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'deleteOne', queryParam: '_id' },
      { params: { _id: userId } }
    )
    expect(result.acknowledged).to.be.true()
    expect(result.deletedCount).to.be.greaterThan(0)
  })

  it('throws an error for invalid query', async () => {
    try {
      await runHandlerWith(
        serverMock,
        { collection: 'users', operation: 'find' },
        { query: { find: '{"invalidJson": value}' } }
      )
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
    }
  })

  it('throws an error for invalid findOne query', async () => {
    try {
      await runHandlerWith(
        serverMock,
        { collection: 'users', operation: 'findOne', queryParam: 'id' },
        { params: { id: '123' }, query: { find: '{"invalidJson": value}' } }
      )
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
    }
  })

  it('correctly calls the aggregate operation with a pipeline as a function', async () => {
    const pipeline = (request) => [{ $match: { name: request.query.name } }, { $project: { _id: 1, name: 1 } }]

    const result = await runHandlerWith(
      serverMock,
      { collection: 'users', operation: 'aggregate', pipeline },
      { query: { name: 'John' } }
    )

    expect(result).to.be.an.array().and.to.have.length(1)
    expect(result[0].name).to.equal('John')
  })

  it('throws an error when the pipeline is not sent in the request', async () => {
    const expectedErrorWhenPipelineIsUndefined = 'Aggregation pipeline must be a function'
    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'aggregate' }, {})
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
      expect(error.message).to.include(expectedErrorWhenPipelineIsUndefined)
    }
  })

  it('throws an error when the pipeline is not a function', async () => {
    const pipelineThatIsNotAFunction = [{ $match: { name: 'John' } }]
    try {
      await runHandlerWith(
        serverMock,
        { collection: 'users', operation: 'aggregate', pipeline: pipelineThatIsNotAFunction },
        {}
      )
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
      expect(error.message).to.include('Aggregation pipeline must be a function')
    }
  })

  it('throws an error when the function does not return an array', async () => {
    const invalidPipeline = () => ({ $match: { name: 'John' } })

    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'aggregate', pipeline: invalidPipeline }, {})
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
      expect(error.message).to.include('Invalid aggregation pipeline')
    }
  })

  it('throws an error when the pipeline is not provided', async () => {
    const expectedErrorWhenPipelineIsNotProvided = 'Aggregation pipeline must be a function'
    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'aggregate' }, {})
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
      expect(error.message).to.include(expectedErrorWhenPipelineIsNotProvided)
    }
  })

  it('throws an error when the function returns null', async () => {
    const nullPipeline = () => null

    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'aggregate', pipeline: nullPipeline }, {})
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(400)
      expect(error.message).to.include('Invalid aggregation pipeline')
    }
  })

  it('returns a mongo error to the user', async () => {
    const invalidPipeline = () => [{ $invalidStage: { invalidField: 'invalidValue' } }]

    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'aggregate', pipeline: invalidPipeline }, {})
    } catch (error) {
      expect(error.isBoom).to.be.true()
      expect(error.output.statusCode).to.be.equal(500)
      expect(error.message).to.include('MongoDB error')
    }
  })

  it('throws an error for unsupported operation', async () => {
    try {
      await runHandlerWith(serverMock, { collection: 'users', operation: 'unsupportedOperation' }, {})
    } catch (error) {
      expect(error.message).to.be.equal('Invaid MongoDB operation passed in: unsupportedOperation')
    }
  })
})
