var EventEmitter = require('events').EventEmitter,
    LogStream = require('./../log-stream.js'),
    config = require('./../../config.js'),
    ImapParser = require('./imap-parser.js'),
    util = require('util'),
    tls = require('tls'),
    mime = require('mime-lib'),

    RE_EXISTS = "(?:^|\\r\\n)\\* (\\d+) EXISTS";

function ImapAdapter() {

  var that = this,
      stream = tls.connect(config.port, config.host, config.tlsOptions),
      logStream = new LogStream(),
      imapParser = new ImapParser().setLogStream(logStream),
      boxes = {}, // { boxName: mailCount }
      selectedBox;

  stream.pipe(imapParser);

  imapParser.addUntaggedListener('handshake', function(res) {
    that.emit('handshake');
    that.login(config.username, config.password);
  });

  /* Public API */

  this.state = null;

  this.ask = function(command, callback) {
    var tag = new Date().getTime();
    commandText = tag + ' ' + command + '\r\n';
    stream.write(commandText, function() {
      logStream.logMe(commandText); // just logging
      imapParser.addTagListener(tag, callback);
    });
  };

  this.login = function(username, password, callback) {
    this.ask('LOGIN ' + username + ' ' + password, function() {
      that.state = 'authenticated';
      that.emit('authenticated');
      if (typeof(callback) == 'function') {
        callback();
      }
    });
  };

  this.selectBox = function(boxName, callback) {
    imapParser.addRegexListener('box_count', RE_EXISTS, function(res) {
      boxes[boxName] = res[1];
      that.emit('box_count', res[1]);
    });
    this.ask('SELECT ' + boxName, function(data) {
      selectedBox = boxName;
      that.state = 'box_selected';
      callback(data);
    });
  };

  this.getCurrentBoxCount = function() {
    return boxes[selectedBox];
  };

  this.fetchHeaders = function(limit, offset, callback) {
    var count = boxes[selectedBox];
    var start = count - offset - limit + 1;
    var end = count - offset;
    cmd = 'FETCH ' + start + ':' + end + ' (BODY[HEADER])';
    imapParser.addMessagesListener(start, end, this.onHeaderParsed);

    this.ask(cmd, function() {});
  };

  this.onHeaderParsed = function(messageId, flags, bodyBuffer) {
    var header = new Header(messageId, flags, bodyBuffer);
    that.emit('header_parsed', header);
  };
}

util.inherits(ImapAdapter, EventEmitter);

module.exports = ImapAdapter;

/* Header */

function Header(messageId, flags, buffer) {
  var FIELD_RE = "^%s: ([\\s\\S]*?)\\r\\n[\\w\\r]",
      fields = ['to', 'from', 'subject', 'date'],
      body = buffer.toString(),
      i, value, res;

  this.messageId = messageId;
  this.flags = flags;

  for (i in fields) {
    value = new RegExp(util.format(FIELD_RE, fields[i]), 'mi').exec(body)[1];
    value = mime.decodeWord(value);
    this[fields[i]] = value;
  }
}
