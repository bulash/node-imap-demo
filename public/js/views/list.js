define([
    'jquery',
    'lib/underscore',
    'lib/backbone',
    'models/message',
    'collections/messages',
    'views/message',
    'text!templates/list.html',
    'lib/jquery.bootstrap-growl',
    'socketio'
  ], function($, _, Backbone, Message, MessageCollection, MsgView, listTpl, growl, io) {

    return Backbone.View.extend({

      el: '#messages',
      list: '#list',
      informEl: '#inform',
      model: Message,
      page: 1,
      perpage: 10,
      socket: null,
      socketReady: false,
      pendingPage: null,
      boxCount: null,

      initialize: function() {
        var that = this;
        this.collection = new MessageCollection();
        this.initSocket();
        this.collection.on('add', function(msg) {
          $(that.list).prepend(new MsgView({model: msg}).render());
        });
      },

      initSocket: function() {
        var that = this;
        if (!this.socket) {
          if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
            this.socket = io.connect("http://localhost:8000", {'transports': ['xhr-polling']});
          } else {
            this.socket = io.connect("http://localhost:8000");
          }
        }

        this.socket.emit('hello');

        this.socket.on('authentication_start', function() {
          that.inform('Authenticating...');
        });

        this.socket.on('authentication_finish', function() {
          that.inform('Authenticated successfully.');
        });

        this.socket.on('box_count', function(boxCount) {
          that.boxCount = boxCount;
          that.inform(boxCount + " emails found...");
        });

        this.socket.on('ready', function() {
          that.inform('Ready for fetching mail...');
          that.socketReady = true;
          if (that.pendingPage) {
            that.toPage(that.pendingPage);
            that.pendingPage = null;
          }
        });

        this.socket.on('header', function(msg) {
          that.collection.add(msg);
        });
      },

      toPage: function(page) {
        if (!this.socketReady) {
          this.pendingPage = page;
          return;
        }

        this.inform("<br/>");

        var that = this;
        this.page = page;
        this.render();
        this.socket.emit('fetch', { page: this.page, perpage: this.perpage });

        return;
      },

      inform: function(msg) {
        $(this.informEl).html(msg);
      },

      render: function() {
        var that = this;
        $(this.el).html(
          _.template(listTpl, {
              page: that.page,
              perpage: that.perpage,
              boxCount: that.boxCount
          })
        );
      }

    });
});

