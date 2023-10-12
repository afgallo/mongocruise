const Boom = require('@hapi/boom')
const Pkg = require('../package.json')
const { buildQueryRequest, getQueryParamValue } = require('./helpers')

exports.plugin = {
  name: Pkg.name,
  version: Pkg.version,
  multiple: false,
  once: true,
  dependencies: 'mongokai',
  requirements: {
    node: '>= 18.x.x',
    hapi: '>= 21.x.x'
  },
  register: (server) => {
    server.decorate('handler', 'mongocruise', (_, options) => {
      const handler = async (request, h) => {
        const { collection, operation, queryParam, setTimestamps = true } = options
        const { db, ObjectId } = h.mongo
        const now = new Date().getTime()
        let result

        switch (operation.toLowerCase()) {
          case 'find': {
            const queryRequest = buildQueryRequest(request.query)

            if (queryRequest.error) {
              return Boom.badRequest('Invalid query options')
            }

            result = await db.collection(collection).find(queryRequest.query, queryRequest.options).toArray()
            break
          }

          case 'findone': {
            const queryRequest = request.query ? buildQueryRequest(request.query) : {}
            const queryValue = getQueryParamValue(queryParam, request, ObjectId)

            if (queryRequest.error) {
              return Boom.badRequest('Invalid query options')
            }

            result = await db.collection(collection).findOne({ [queryParam]: queryValue }, queryRequest.options)
            break
          }

          case 'insertone': {
            if (setTimestamps) {
              request.payload.createdAt = now
              request.payload.updatedAt = now
            }

            const inserted = await db.collection(collection).insertOne(request.payload)

            result = { _id: inserted.insertedId, ...request.payload }
            break
          }

          case 'updateone': {
            const queryValue = getQueryParamValue(queryParam, request, ObjectId)

            if (setTimestamps) {
              request.payload.updatedAt = now
            }

            result = await db.collection(collection).updateOne({ [queryParam]: queryValue }, { $set: request.payload })
            break
          }

          case 'deleteone': {
            result = await db
              .collection(collection)
              .deleteOne({ [queryParam]: new ObjectId(request.params[queryParam]) })
            break
          }

          default:
            throw new Error(`Invaid MongoDB operation passed in: ${operation}`)
        }

        return result
      }

      return handler
    })
  }
}
