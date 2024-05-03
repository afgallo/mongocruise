const Pkg = require('../package.json')
const Mongocruise = require('./mongocruise')

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
    server.decorate('handler', 'mongocruise', (_, options) => Mongocruise(options))
  }
}
