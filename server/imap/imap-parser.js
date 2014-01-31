var stream = require('stream'),
    util = require('util'),
    //mime = require('mime-lib'),

    OK = "OK",
    BAD = "BAD",
    NO = "NO",
    RE_UNTAGGED = "^\\* (\\w+)\\W",
    RE_TAGGED = "^%s (OK|NO|BAD)\\W",
    RE_HEADER = "^\\* %s FETCH \\((FLAGS \\(.*\\) )?BODY\\[HEADER\\] \\{(\\d+)\\}\\r\\n([\\s\\S]*)";

/* MessageStream */

function MessageStream() {
  stream.Writable.call(this, options);
}

MessageStream.prototype._write = function(chunk) {
};

util.inherits(MessageStream, stream.Writable);

/* ImapParser */

function ImapParser(options) {
  stream.Writable.call(this, options);
  this.chunkListeners = [];

  var that = this;

  this._write = function(chunk, encoding, callback) {
    if (this.logStream) {
      this.logStream.logServer(chunk);
    }
    for (var name in this.chunkListeners) {
      this.chunkListeners[name].write(chunk, encoding);
    }
    callback();
  };

  this.addChunkListener = function(name, listener, callback) {
    listener.on('end', function(res, chunk) {
      that.emit(name, res);
      if (typeof(callback) == 'function') {
        callback(res, chunk);
      }
      delete that.chunkListeners[name];
    });

    this.chunkListeners[name] = listener;
  };

  this.addRegexListener = function(name, regex, callback) {
    this.addChunkListener(name, new RegexListener(regex), callback);
  };

  this.addUntaggedListener = function(name, callback) {
    this.addRegexListener(name, RE_UNTAGGED, callback);
  };

  this.addTagListener = function(tag, callback, errorCallback) {
    this.addRegexListener(tag, util.format(RE_TAGGED, tag),
      function(res) {
        if (res && res[1] && res[1] == OK && typeof(callback) == 'function') {
          callback();
        } else if (typeof(errorCallback) == 'function') {
          errorCallback();
        }
    });
  };

  this.addMessagesListener = function(start, end, headerParsedCallback) {
    this.addChunkListener('messages', new MessageListener(start, end, headerParsedCallback));
  };

  this.setLogStream = function(logStream) {
    this.logStream = logStream;
    return this;
  };

}

util.inherits(ImapParser, stream.Writable);
module.exports = ImapParser;

/* RegexListener */

function RegexListener(regex) {
  this.regex = typeof(regex) == 'string' ? new RegExp(regex, 'im') : regex;
  // saving the previous chunk. Regex might be divided between chunks,
  // but we assume there won't be regexes split into 3+ chunks
  this.prev = "";
  stream.Writable.call(this);
}

util.inherits(RegexListener, stream.Writable);

RegexListener.prototype._write = function(chunk, encoding, callback) {
  var c = this.prev + chunk.toString(),
      res = this.regex.exec(c);
  if (res) {
    this.emit('end', res);
  } else {
    this.prev = chunk.toString();
  }
  callback();
};

/* MessageListener */

function MessageListener(start, end, headerParsedCallback) {
  stream.Writable.call(this);
  this.start = start;
  this.end = end;
  this.current = start;
  this.preceding = "";
  this.pendingStringWrapper = null;
  this.headerParsedCallback = headerParsedCallback;
}

util.inherits(MessageListener, stream.Writable);

MessageListener.prototype._write = function(chunk, encoding, callback) {
  var that = this,
      string = chunk.toString(),
      i, regex, res, id, flags, size, body;

  if (this.pendingStringWrapper) {
    this.pendingStringWrapper.write(chunk);
  }

  while (this.current <= this.end) {
    regex = new RegExp(util.format(RE_HEADER, this.current), 'im');
    res = regex.exec(string);

    if (res && res[2] && res[3]) {

      id = this.current;
      flags = res[1];
      size = res[2];
      body = res[3];

      this.pendingStringWrapper = new StringWrapperListener(size);
      this.pendingStringWrapper.on('end', function(bodyBuffer) {
        that.pendingStringWrapper = null;
        that.headerParsedCallback(id, flags, bodyBuffer);
      });

      this.pendingStringWrapper.write(body);

      this.current++;
    } else {
      break;
    }

    if (this.current > this.end) {
      this.emit('end');
    }
  }

  callback();
};

/* StringWrapperListener */

function StringWrapperListener(size) {
  stream.Writable.call(this);
  this.bytesWritten = 0;
  this.buffer = new Buffer(+size);
}

util.inherits(StringWrapperListener, stream.Writable);

StringWrapperListener.prototype._write = function(chunk, encoding, callback) {
  chunk.copy(this.buffer, this.bytesWritten);
  this.bytesWritten += chunk.length;
  if (this.bytesWritten >= this.buffer.length - 1) {
    this.emit('end', this.buffer);
  }
  callback();
};
