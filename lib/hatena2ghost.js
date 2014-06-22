var fs = require('fs');
var Getopt = require('node-getopt');
var HatenaParser = require('./hatena-parser');
var Promise = require('promise');
var read = Promise.denodeify(fs.readFile);

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
        //console.log(hatenaParser.getData());
      });
  });
