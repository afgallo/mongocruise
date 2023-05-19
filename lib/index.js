const Boom = require('@hapi/boom')
const Pkg = require('../package.json')
const { buildQueryRequest } = require('./helpers')

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
        const { collection, operation, queryParam } = options
        const { db, ObjectId } = h.mongo
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
            result = await db.collection(collection).findOne({ [queryParam]: new ObjectId(request.params[queryParam]) })
            break
          }

          case 'insertone': {
            result = await db.collection(collection).insertOne(request.payload)
            break
          }

          case 'updateone': {
            result = await db
              .collection(collection)
              .updateOne({ [queryParam]: request.params[queryParam] }, { $set: request.payload })
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
