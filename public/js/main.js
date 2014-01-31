require.config({
    baseUrl: 'js',
    paths: {
        jquery: 'lib/jquery-1.11.0',
        text: 'lib/text',
        moment: 'lib/moment-with-langs',
        bootstrap: '//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js',
        socketio: 'http://localhost:8000/socket.io/socket.io'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'lib/underscore': {
            exports: '_'
        },
        'lib/backbone': {
            deps: ['lib/underscore', 'jquery'],
            exports: 'Backbone'
        },
        'app': {
            deps: ['jquery', 'lib/underscore', 'lib/backbone'],
            exports: 'App'
        },
        'socketio': {
            exports: 'io'
        }
    }
});

define(['jquery', 'lib/underscore', 'lib/backbone', 'app'], function($, _, Backbone, App) {
  App.init();
});
