![workflow](https://github.com/afgallo/mongocruise/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/afgallo/mongocruise/branch/main/graph/badge.svg?token=JNSHLDP2DD)](https://codecov.io/gh/afgallo/mongocruise)

# Mongocruise

_"A smooth, trouble-free journey through your MongoDB collections with simple RESTful APIs."_

Mongocruise is a flexible, user-friendly plugin for the Hapi.js server framework. It provides an intuitive way to create MongoDB-backed HTTP routes.

## Features

- Easily define CRUD operations in your Hapi.js routes.
- Flexible route parameters that leverage MongoDB's search capabilities.
- Supports various MongoDB operations including `find`, `findOne`, `insertOne`, `updateOne`, `deleteOne`, and `aggregate` for more advanced queries.

## Installation

```
npm install mongocruise
```

## Prerequisites

This plugin requires a MongoDB connection registered on the server using the `mongokai` Hapi.js [plugin](https://github.com/afgallo/mongokai). The connection is exposed via a property `server.mongo.db`.

## Usage

1. Register the plugin:

```javascript
await server.register(require('mongocruise'))
```

2. Use the `mongocruise` handler in your route configurations:

```javascript
{
  method: 'GET',
  path: '/users',
  handler: {
    mongocruise: {
      collection: 'users',
      operation: 'find',
    }
  }
}
```

For aggregate operations, the pipeline option must be a function that returns an array representing the aggregation pipeline:

```javascript
{
  method: 'GET',
  path: '/aggregatedUsers',
  handler: {
    mongocruise: {
      collection: 'users',
      operation: 'aggregate',
      pipeline: (request) => [
        { $match: { age: { $gte: 18 } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]
    }
  }
}
```

The `mongocruise` handler supports the following options:

- `collection`: The MongoDB collection to use.
- `operation`: The MongoDB operation to perform. Can be one of `find`, `findOne`, `insertOne`, `updateOne`, `deleteOne`, or `aggregate`.
- `queryParam`: The parameter to use for `findOne`, `updateOne`, and `deleteOne` operations.
- `setTimestamps`: The flag to add `createdAt` or `updatedAt` on the create and update operations.
- `pipeline`: A function that returns an array representing the aggregation pipeline for `aggregate` operations.

For `find` operations, query parameters such as `skip`, `limit`, `sort`, `projection`, and `find` can be passed directly in the request. These parameters should be in JSON format.

## Example

### Simple Query Example

```javascript
{
  method: 'GET',
  path: '/users/{id}',
  handler: {
    mongocruise: {
        collection: 'users',
        operation: 'findOne',
        queryParam: '_id'
    }
  }
}
```

This route configuration would use the `findOne` operation on the `users` collection, using the `_id` route parameter to find a specific user.

### Aggregation Example

```javascript
{
  method: 'GET',
  path: '/todos',
  handler: {
    mongocruise: {
      collection: 'todos',
      operation: 'aggregate',
      pipeline: (request) => [
        { $match: { author: request.query.userId } },
        { $facet: {
            totalTodos: [{ $count: "count" }],
            todos: [
              { $skip: request.query.skip || 0 },
              { $limit: request.query.limit || 10 },
              { $project: { _id: 1, title: 1 } }
            ]
          }
        },
        { $project: {
            totalTodos: { $arrayElemAt: ["$totalTodos.count", 0] },
            todos: 1
          }
        }
      ]
    }
  }
}
```

Note that `pipeline` is a function. This is required since we need to pass down the `request` values to the pipeline to support dynamic values.

## Error Handling

If an invalid operation is passed in, or if there's an issue with the request's query parameters, `mongocruise` will throw an error.

## Testing

This plugin is thoroughly unit tested. Please refer to the tests in the `/test` directory for more examples of how to use the plugin.

## Contribution

Contributions are welcome! Please submit a pull request and ensure your changes pass the existing tests and linting rules.

## License

This project is licensed under the MIT License. See the [license](LICENSE) file for details.
