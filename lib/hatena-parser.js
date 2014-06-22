var es = require('event-stream');

var MODE = {
  NORMAL: 0,
  BODY: 1,
  EXCERPT: 2
};

var HatenaParser = function HatenaParser () {
  this._mode = MODE.NORMAL;
  this._json = {
    posts: []
  };
  this._currentPost = {};
};

HatenaParser.prototype._parseRow = function (row) {
  if (this._mode == MODE.NORMAL) {
    //console.log(row);
  }
  if (this._mode == MODE.BODY) {
    this._currentPost.body += row + '\n';
  }
  if (this._mode == MODE.EXCERPT) {
    this._currentPost.excerpt += row + '\n';
  }

  if (row.match(/^TITLE:\s(.+)$/)) {
    if (this._currentPost) {
      this._json.posts.push(this._currentPost);
    }
    this._currentPost = {
      category: []
    };

    var title = RegExp.$1;
    this._currentPost.title = title;
    this._mode = MODE.NORMAL;
  }

  if (row.match(/^AUTHOR:\s(.+)$/)) {
    var author = RegExp.$1;
    this._currentPost.author = author;
  }

  if (row.match(/^DATE:\s(.+)$/)) {
    var date = RegExp.$1;
    this._currentPost.date = date;
  }

  if (row.match(/^STATUS:\s(.+)$/)) {
    var status = RegExp.$1;
    this._currentPost.status = status;
  }

  if (row.match(/^CATEGORY:\s(.+)$/)) {
    var cat = RegExp.$1;
    this._currentPost.category.push(cat);
  }

  if (row.match(/^BODY:/)) {
    this._mode = MODE.BODY;
  }

  if (row.match(/^EXCERPT:/)) {
    this._mode = MODE.EXCERPT;
  }
};

HatenaParser.prototype._parse = function (data) {
  var rows = data.split('\n');

  for (var i = 0, len = rows.length; i < len; i++) {
    this._parseRow(rows[i]);
  }
};

HatenaParser.prototype.stream = function () {
  var theParser = this;
  var stream = es.through(
    function (buf) {
      var data = buf.toString();

      theParser._parse(data);

      this.emit('data', data);
    },

    function () {
      this.emit('end');
    }
  );

  return stream;
};

HatenaParser.prototype.getData = function () {
  return this._json;
};

module.exports = HatenaParser;
