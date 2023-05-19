# Mongocruise

_"A smooth, trouble-free journey through your MongoDB collections with simple RESTful APIs."_

Mongocruise is a flexible, user-friendly plugin for the Hapi.js server framework. It provides an intuitive way to create MongoDB-backed HTTP routes.

## Features

- Easily define CRUD operations in your Hapi.js routes.
- Flexible route parameters that leverage MongoDB's search capabilities.
- Supports various MongoDB operations including `find`, `findOne`, `insertOne`, `updateOne`, and `deleteOne`.

## Installation

```
npm install mongocruise
```

## Prerequisites

This plugin requires a MongoDB connection registered on the server using the `mongokai` Hapi.js plugin. The connection is exposed via a property `server.mongo.db`.

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

The `mongocruise` handler supports the following options:

- `collection`: The MongoDB collection to use.
- `operation`: The MongoDB operation to perform. Can be one of `find`, `findOne`, `insertOne`, `updateOne`, or `deleteOne`.
- `queryParam`: The parameter to use for `findOne`, `updateOne`, and `deleteOne` operations.

For `find` operations, query parameters such as `skip`, `limit`, `sort`, `projection`, and `find` can be passed directly in the request. These parameters should be in JSON format.

## Example

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

This route configuration would use the `findOne` operation on the `users` collection, using the `id` route parameter to find a specific user.

## Error Handling

If an invalid operation is passed in, or if there's an issue with the request's query parameters, `mongocruise` will throw an error.

## Testing

This plugin is thoroughly unit tested. Please refer to the tests in the `/test` directory for more examples of how to use the plugin.

## Contribution

Contributions are welcome! Please submit a pull request and ensure your changes pass the existing tests and linting rules.

## License

This project is licensed under the MIT License. See the [license](LICENSE) file for details.
