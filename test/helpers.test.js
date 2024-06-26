const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { buildQueryRequest } = require('../lib/helpers')
const { ObjectId } = require('mongodb')

const { describe, it } = (exports.lab = Lab.script())
const { expect } = Code

describe('mongocruise - helpers', () => {
  it('should handle "skip" query parameter', () => {
    const request = { skip: 10 }
    const result = buildQueryRequest(request)
    expect(result.options.skip).to.be.a.number().and.to.equal(10)
  })

  it('should handle undefined "skip" query parameter', () => {
    const request = { skip: undefined }
    const result = buildQueryRequest(request)
    expect(result.options.skip).to.be.a.number().and.to.equal(0)
  })

  it('should handle "limit" query parameter', () => {
    const request = { limit: 5 }
    const result = buildQueryRequest(request)
    expect(result.options.limit).to.be.a.number().and.to.equal(5)
  })

  it('should handle undefined "limit" query parameter', () => {
    const request = { limit: null }
    const result = buildQueryRequest(request)
    expect(result.options.limit).to.be.a.number().and.to.equal(100)
  })

  it('should handle "sort" query parameter', () => {
    const request = { sort: '{"name": 1}' }
    const result = buildQueryRequest(request)
    expect(result.options.sort).to.equal({ name: 1 })
  })

  it('should handle "projection" query parameter', () => {
    const request = { projection: '{"name": 1, "_id": 0}' }
    const result = buildQueryRequest(request)
    expect(result.options.projection).to.equal({ name: 1, _id: 0 })
  })

  it('should handle "find" query parameter', () => {
    const request = { find: '{"status": "active"}' }
    const result = buildQueryRequest(request)
    expect(result.query).to.equal({ status: 'active' })
  })

  it('should convert _id to ObjectId automatically', () => {
    const request = { find: '{"_id": "663d67b980370ea81825a41a"}' }
    const result = buildQueryRequest(request)
    expect(result.query._id instanceof ObjectId).to.equal(true)
  })

  it('should convert _id in $in to ObjectId automatically', () => {
    const request = { find: '{"_id": { "$in": ["663d67b980370ea81825a41a"] }}' }
    const result = buildQueryRequest(request)
    expect(result.query._id.$in[0] instanceof ObjectId).to.equal(true)
  })

  it('builds query request correctly with valid parameters', () => {
    const params = {
      skip: 10,
      limit: 5,
      sort: '{"field":"asc"}',
      projection: '{"field":1}',
      find: '{"field":"value"}'
    }

    const result = buildQueryRequest(params)

    expect(result).to.be.an.object()
    expect(result.query).to.equal({ field: 'value' })
    expect(result.options).to.equal({
      skip: 10,
      limit: 5,
      sort: { field: 'asc' },
      projection: { field: 1 }
    })
  })

  it('returns an error for invalid JSON format in parameters', () => {
    const params = {
      skip: '10',
      limit: '5',
      sort: '{"field":"asc"}',
      projection: '{"field":1}', // valid JSON
      find: '{"field":"value"' // invalid JSON
    }

    const result = buildQueryRequest(params)

    expect(result).to.be.an.object()
    expect(result.error).to.be.a.string()
    expect(result.error).to.startWith('Invalid JSON format:')
  })
})
