'use strict';

const Path = require('path');
const Hapi = require('hapi');
const Inert = require('inert');
const Good = require('good');
const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, process.env.DIST_DIRECTORY || 'public')
      }
    }
  }
});

server.connection({
  port: 8080
});

server.register([
  {
    register: Inert
  },
  {
    register: Good,
    options: {
      reporters: {
        console: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{
            response: '*',
            log: '*'
          }]
        }, {
          module: 'good-console'
        }, 'stdout']
      }
    }
  }
], err => {
  if (err) {
    throw err;
  }

  server.route({
    method: 'GET',
    path: '/{params*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true
      }
    }
  });

  server.ext('onPostHandler', (request, reply) => {
    const response = request.response;
    if (response.isBoom && response.output.statusCode === 404) {
      return reply.file('index.html');
    }

    return reply.continue();
  });

  server.start(err => {
    if (err) {
      throw err;
    }

    server.log('info', `Server running at: ${server.info.uri}`);
  });
});
