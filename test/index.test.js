const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { plugin } = require('../lib')

const { describe, it, beforeEach, afterEach } = (exports.lab = Lab.script())
const { expect } = Code

describe('mongocruise - plugin', () => {
  let serverMock

  beforeEach(() => {
    serverMock = {
      mongo: {
        db: {
          collection: Sinon.stub().returnsThis(),
          find: Sinon.stub().returnsThis(),
          findOne: Sinon.stub().resolves({}),
          insertOne: Sinon.stub().resolves({}),
          updateOne: Sinon.stub().resolves({}),
          deleteOne: Sinon.stub().resolves({}),
          toArray: Sinon.stub().resolves([])
        },
        ObjectId: Sinon.stub()
      },
      decorate: Sinon.stub()
    }
  })

  afterEach(() => {
    Sinon.restore()
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

    expect(serverMock.mongo.db.collection.calledWith('users')).to.be.true()
    expect(serverMock.mongo.db.find.calledOnce).to.be.true()
    expect(result).to.be.an.array()
  })

  it('correctly calls the findOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'findOne',
      queryParam: 'id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { id: '123' } }, handlerOptions)
    const result = await handler({ params: { id: '123' } }, serverMock)

    expect(serverMock.mongo.db.collection.calledWith('users')).to.be.true()
    expect(serverMock.mongo.db.findOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
  })

  it('correctly calls the insertOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'insertOne'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ payload: { name: 'John' } }, serverMock)

    expect(serverMock.mongo.db.collection.calledWith('users')).to.be.true()
    expect(serverMock.mongo.db.insertOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
  })

  it('adds createdAt and updatedAt on the insertOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'insertOne'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({}, handlerOptions)
    const result = await handler({ payload: { name: 'John' } }, serverMock)
    expect(Object.keys(serverMock.mongo.db.insertOne.getCall(0).args[0])).to.equal(['name', 'createdAt', 'updatedAt'])
    expect(result).to.be.an.object()
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
    expect(Object.keys(serverMock.mongo.db.insertOne.getCall(0).args[0])).to.equal(['name'])
    expect(result).to.be.an.object()
  })

  it('correctly calls the updateOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: 'id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { id: '123' } }, handlerOptions)
    const result = await handler({ params: { id: '123' }, payload: { name: 'John' } }, serverMock)

    expect(serverMock.mongo.db.collection.calledWith('users')).to.be.true()
    expect(serverMock.mongo.db.updateOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
  })

  it('adds updatedAt on the updateOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: 'id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { id: '123' } }, handlerOptions)
    const result = await handler({ params: { id: '123' }, payload: { name: 'John' } }, serverMock)

    expect(Object.keys(serverMock.mongo.db.updateOne.getCall(0).args[1].$set)).to.equal(['name', 'updatedAt'])
    expect(serverMock.mongo.db.updateOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
  })

  it('omits updatedAt on the updateOne operation if setTimestamps is set to false', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'updateOne',
      queryParam: 'id',
      setTimestamps: false
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { id: '123' } }, handlerOptions)
    const result = await handler({ params: { id: '123' }, payload: { name: 'John' } }, serverMock)

    expect(Object.keys(serverMock.mongo.db.updateOne.getCall(0).args[1].$set)).to.equal(['name'])
    expect(serverMock.mongo.db.updateOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
  })

  it('correctly calls the deleteOne operation', async () => {
    const handlerOptions = {
      collection: 'users',
      operation: 'deleteOne',
      queryParam: 'id'
    }

    plugin.register(serverMock)

    const handler = serverMock.decorate.args[0][2]({ params: { id: '123' } }, handlerOptions)
    const result = await handler({ params: { id: '123' } }, serverMock)

    expect(serverMock.mongo.db.collection.calledWith('users')).to.be.true()
    expect(serverMock.mongo.db.deleteOne.calledOnce).to.be.true()
    expect(result).to.be.an.object()
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
