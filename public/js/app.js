define(['routers/router', 'views/list', 'socketio'], function(Router, ListView, socketio) {
  return {
    init: function() {
      new Router();
      Backbone.history.start();
    }
  };
});
