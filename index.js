var split = require('split2')
var pumpify = require('pumpify')
var through = require('through2')

module.exports = function() {
  var buf = []
  var first = true
  re_ass = new RegExp("Dialogue:\\s\\d," + // get time and subtitle
        "(\\d+:\\d\\d:\\d\\d.\\d\\d)," +     // start time
        "(\\d+:\\d\\d:\\d\\d.\\d\\d)," +     // end time
        "([^,]*)," +                  // object
        "([^,]*)," +                  // actor
        "(?:[^,]*,){4}" +
        "(.*)$", "i")                // subtitle

  re_newline = /\\n/ig // replace \N with newline
  re_style = / \{ [^}]+ \}/ // replace style
  var i = 1;
  var write = function(line, enc, cb) {
    var m = line.match(re_ass);
    if (!m) {
      return cb();
    }
    var start = m[1], end = m[2], what = m[3], actor = m[4], text = m[5];
    text = text.replace(re_style, "").replace(re_newline, "\r\n");
    var content = i + "\r\n"
        content += "0" + start + "0 --> 0" + end + "0\r\n"
        content += "<v " + what + " " + actor + ">" + text + "\r\n\r\n"

    i++;
    cb(null, content)
  }

  var parse = through.obj(write)
  parse.push('WEBVTT FILE\r\n\r\n')
  return pumpify(split(), parse)
}

