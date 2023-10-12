const plugin = require('../../lib').plugin

const getHandler = (serverMock, handlerOptions) => {
  plugin.register(serverMock)
  const decoratorFunc = serverMock.decorate.args[0][2]
  return decoratorFunc({}, handlerOptions)
}

const runHandlerWith = async (serverMock, handlerOptions, request) => {
  const handler = getHandler(serverMock, handlerOptions)
  return await handler(request, serverMock)
}

module.exports = {
  getHandler,
  runHandlerWith
}
