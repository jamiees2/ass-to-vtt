var split = require('split2')
var pumpify = require('pumpify')
var through = require('through2')

module.exports = function() {
  var re_ass = new RegExp("Dialogue:\\s\\d," + // get time and subtitle
        "(\\d+:\\d\\d:\\d\\d.\\d\\d)," +     // start time
        "(\\d+:\\d\\d:\\d\\d.\\d\\d)," +     // end time
        "([^,]*)," +                  // object
        "([^,]*)," +                  // actor
        "(?:[^,]*,){4}" +
        "(.*)$", "i");                // subtitle

  var re_newline = /\\n/ig; // replace \N with newline
  var re_style = /\{([^}]+)\}/; // replace style
  var i = 1;
  var write = function(line, enc, cb) {
    var m = line.match(re_ass);
    if (!m) {
      return cb();
    }
    var start = m[1], end = m[2], what = m[3], actor = m[4], text = m[5];

    var style, pos_style = "", tagsToClose = []; // Places to stash style info.
    // Subtitles may contain any number of override tags, so we'll loop through
    // to find them all.
    while ( (style = text.match(re_style)) ) {
      var tagsToOpen = [], replaceString = '';
      if ( style[1] && style[1].split ) { // Stop throwing errors on empty tags.
        style = style[1].split("\\"); // Get an array of override commands.
        for (var j = 1; j < style.length; j++) {
          var firstLetter = style[j].substring(0,1);

          // "New" position commands. It is assumed that bottom center position is the default.
          if ( style[j].substring(0,2) === "an" ) {
            var posNum = Number(style[j].substring(2,3));
            if ( Math.floor((posNum-1)/3) == 1) {
              pos_style += ' line:50%';
            } else  if ( Math.floor((posNum-1)/3) == 2) {
              pos_style += ' line:0';
            }
            if ( posNum % 3 == 1 ) {
              pos_style += ' align:start';
            } else if ( posNum % 3 == 0 ) {
              pos_style += ' align:end';
            }
            // Legacy position commands.
          } else if ( firstLetter === "a" && !Number.isNaN(Number(style[j].substring(1,2))) ) {
            var posNum = Number(style[j].substring(1,2));
            if ( posNum > 8 ) {
              pos_style += ' line:50%';
            } else if ( posNum > 4 ) {
              pos_style += ' line:0';
            }
            if ( (posNum-1) % 4 == 0 ) {
              pos_style += ' align:start';
            } else if ( (posNum-1) % 4 == 2 ) {
              pos_style += ' align:end';
            }
            // Map simple text decoration commands to equivalent WebVTT text tags.
            // NOTE: Strikethrough (the 's' tag) is not supported in WebVTT.
          } else if ( ['b', 'i', 'u', 's'].includes(firstLetter) ) {
            if ( Number(style[j].substring(1,2)) === 0 ) {
              // Closing a tag.
              if ( tagsToClose.includes(firstLetter) ) {
                // Nothing needs to be done if this tag isn't already open.
                // HTML tags must be nested, so we must ensure that any tag nested inside
                // the tag being closed are also closed, and then opened again once the
                // current tag is closed.
                while ( tagsToClose.length > 0 ) {
                  var nowClosing = tagsToClose.pop();
                  replaceString += '</' + nowClosing + '>';
                  if ( nowClosing !== firstLetter ) {
                    tagsToOpen.push(nowClosing);
                  } else {
                    // There's no need to close the tags that the current tag
                    // is nested within.
                    break;
                  }
                }
              }
            } else {
              // Opening a tag.
              if ( !tagsToClose.includes( firstLetter ) ) {
                // Nothing needs to be done if the tag is already open.
                // If no, place the tag on the bottom of the stack of tags being opened.
                tagsToOpen.splice(0, 0, firstLetter);
              }
            }
          }

          // Insert open-tags for tags in the to-open list.
          while ( tagsToOpen.length > 0 ) {
            var nowOpening = tagsToOpen.pop();
            replaceString += '<' + nowOpening + '>';
            tagsToClose.push(nowOpening);
          }
        }
      }
      text = text.replace(re_style, replaceString); // Replace override tag.
    }

    text = text.replace(re_newline, "\r\n");
    var content = i + "\r\n"
    content += "0" + start + "0 --> 0" + end + "0" + pos_style + "\r\n"
    content += "<v " + what + " " + actor + ">" + text
    while ( tagsToClose.length > 0 ) {
      content += '</' + tagsToClose.pop() + '>';
    }
    content += "\r\n\r\n";

    i++;
    cb(null, content)
  }

  var parse = through.obj(write)
  parse.push('WEBVTT\r\n\r\n')
  return pumpify(split(), parse)
}

