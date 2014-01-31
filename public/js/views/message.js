define([
    'jquery',
    'lib/underscore',
    'lib/backbone',
    'moment',
    'models/message',
    'text!templates/row.html'
  ], function($, _, Backbone, moment, Message, rowTpl) {

  return Backbone.View.extend({
    model: new Message(),
    render: function(){
      var m = moment(this.model.get('date'));
      this.model.set('fromnow', m.fromNow());
      return _.template(rowTpl, this.model.toJSON());
    }
  });

});
