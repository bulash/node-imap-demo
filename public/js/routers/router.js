define([
    'jquery',
    'lib/underscore',
    'lib/backbone',
    'views/list'
  ], function($, _, Backbone, ListView) {

    return Backbone.Router.extend({

        listView: new ListView(),

        routes: {
          '': 'home',
          'p:page': 'toPage'
        },

        home: function () {
          this.toPage(1);
        },

        toPage: function (page) {
          this.listView.toPage(page);
        }

    });
});


