# ass-to-vtt

Based on @mafintosh's work on [srt-to-vtt](https://github.com/mafintosh/srt-to-vtt).

Transform stream that converts ass files to vtt files.
vtt files are used to provide subtitles in html5 video

```
npm install ass-to-vtt
```

## Usage

``` js
var ass2vtt = require('ass-to-vtt')
var fs = require('fs')

fs.createReadStream('some-subtitle-file.ass')
  .pipe(ass2vtt())
  .pipe(fs.createWriteStream('some-html5-video-subtitle.vtt'))
```

## Command line usage

There is also a command line tool available

```
npm install -g ass-to-vtt
ass-to-vtt --help
```

## License

MIT
