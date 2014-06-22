var stdin = require('stdin');

stdin(function (data) {
  var json = JSON.parse(data);
  json.data.posts = [];
  console.log(JSON.stringify(json));
});
