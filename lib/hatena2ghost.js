var fs = require('fs');
var Getopt = require('node-getopt');
var HatenaParser = require('./hatena-parser');
var Promise = require('promise');
var _ = require('underscore'); var uuid = require('uuid');
var moment = require('moment');
var markdown = require('markdown-js').markdown;
var mecab = require('mecab');
var parser = new mecab.MeCab();
var cheerio = require('cheerio');
var async = require('async');
var slug = require('slug');
var read = Promise.denodeify(fs.readFile);

var postTemplate = function (param) {
  return _({
    "id": 2, "uuid": "6a73e869-8d57-4a87-8bb6-38ce09ad6351",
    "title": "",
    "slug": "ghostdeburoguwoshu-itemiru",
    "markdown": "",
    "html": "",
    "words": "",
    "image": null,
    "featured": 0,
    "page": 0,
    "status": "published",
    "language": "ja_JP",
    "meta_title": null,
    "meta_description": null,
    "author_id": 1,
    "created_at": 1403368039733,
    "created_by": 1,
    "updated_at": 1403368062518,
    "updated_by": 1,
    "published_at": 1403368062519,
    "published_by": 1
  }).extend(param);
};

var opt = Getopt.create([
  ['G', '='],
  ['H', '='],
  ['h', 'help'],
  ['v', 'version']
])
.bindHelp()
.parseSystem();

var options = opt.options;
var filePathGhost = options.G;
var filePathHatena = options.H;

if (!filePathGhost || !filePathHatena) {
  throw new Error('Please specify files');
}

Promise
  .all([
    read(filePathGhost)
  ])
  .then(function (res) {
    var contentGhost = res[0];
    var contentHatena = res[1];

    var base = JSON.parse(contentGhost);
    var hatenaParser = new HatenaParser();
    var hatenaParserStream = hatenaParser.stream();
    var hatenaStream = fs.createReadStream(filePathHatena);

    hatenaStream
      .pipe(hatenaParserStream)
      .on('end', function () {
        // [TODO] convert the data into Ghost format
        var data = hatenaParser.getData();
        var posts = data.posts;
        var index = posts.length;
        var usedSlugs = [];

        async.map(posts, function (post, next) {
          var s = slug(post.title).trim() || uuid.v4();
          if (~usedSlugs.indexOf(s)) {
            s += '-' + uuid.v4();
          }
          usedSlugs.push(s);

          var ghostSeed = {
            id: index--,
            uuid: uuid.v4(),
            title: post.title,
            slug: s,
            created_at: moment(post.date).valueOf(),
            updated_at: moment(post.date).valueOf(),
            published_at: moment(post.date).valueOf(),
            markdown: post.body,
            html: markdown(post.body)
          };

          var htmlText = cheerio.load(ghostSeed.html).root().text();

          parser.parse(htmlText, function (err, result) {
            if (err) throw err;

            ghostSeed.words = JSON.stringify(result);
            var ghostPost = postTemplate(ghostSeed);

            next(null, ghostPost);
          });
        }, function (err, results) {
          base.data.posts = results.reverse();

          console.log(JSON.stringify(base, null, '  '));
        });
      });
  });
