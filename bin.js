#!/usr/bin/env node

var ass2vtt = require('./')
var minimist = require('minimist')
var fs = require('fs')

var argv = minimist(process.argv.slice(2), {
  alias: {out:'o', help:'h'},
  default: {out:'-'}
})

if (argv.help) {
  console.error('Usage: ass-to-vtt [filename?] [options?]')
  process.exit(1)
}

process.stdout.on('error', function(err) {
  if (err.code !== 'EPIPE') throw err
})

var filename = argv._[0] || '-'
var input = filename === '-' ? process.stdin : fs.createReadStream(filename)
var output = argv.out === '-' ? process.stdout : fs.createWriteStream(argv.out)

input.pipe(ass2vtt()).pipe(output)