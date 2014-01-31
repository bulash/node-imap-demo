var io = require('socket.io').listen(8000);
var ImapAdapter = require('./../imap/imap-adapter.js');
var imap;

exports.index = function(req, res){
  res.render('index', {
    title: 'IMAP Demo',
  });
};

// declaring socket.io connections
io.sockets.on('connection', function (socket) {
  socket.on('hello', function() {
    imap = new ImapAdapter();
    socket.emit('authentication_start');

    imap.on('authenticated', function() {
      socket.emit('authentication_finish');
      imap.selectBox('INBOX', function() {
        socket.emit('ready');
      });
    });

    imap.on('box_count', function(boxCount) {
      socket.emit('box_count', boxCount);
    });

    imap.on('header_parsed', function(header) {
      socket.emit('header', header);
    });
  });

  socket.on('fetch', function(req) {
    var limit = req.perpage;
    var offset = req.perpage * (req.page - 1);
    imap.fetchHeaders(limit, offset);
  });

});