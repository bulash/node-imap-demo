define([
    'lib/backbone',
    'models/message'
    ], function(Backbone, Message) {
      return Backbone.Collection.extend({
          url: '/fetch',
          model: Message
      });
});

