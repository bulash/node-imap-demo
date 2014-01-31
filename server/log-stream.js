/* Simple Logging of imap chats */

var stream = require('stream'),
    util = require('util'),
    fs = require('fs');

function LogStream(file) {
  file = file || "imap.log";
  this.fileStream = fs.createWriteStream(file, {flags: 'a'});
  this.fileStream.write("\n[NEW SESSION STARTED] " + (new Date().toString()) + "\n\n");

  this.logServer = function(text) {
    this.fileStream.write("<SERVER:>\n" + text);
  };

  this.logMe = function(text) {
    this.fileStream.write("<ME:>\n" + text);
  };
}

module.exports = LogStream;
