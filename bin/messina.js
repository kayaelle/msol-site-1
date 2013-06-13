#!/usr/bin/env node

const stdin = process.stdin;
const stdout = process.stdout;
const stderr = process.stderr;

const gelfStream = require('gelf-stream');

const GRAYLOG_HOST = process.env['GRAYLOG_HOST'];
const GRAYLOG_PORT = process.env['GRAYLOG_PORT'];

const logStream = gelfStream.forBunyan(GRAYLOG_HOST, GRAYLOG_PORT);

function isValidRecord(rec) {
  if (rec.v == null ||
      rec.level == null ||
      rec.name == null ||
      rec.hostname == null ||
      rec.pid == null ||
      rec.time == null ||
      rec.msg == null) {
    // Not valid Bunyan log.
    return false;
  } else {
    return true;
  }
}

function handleLogLine(line) {
  // Emit non-JSON lines immediately.
  var rec;
  if (!line)
    return emit(line + '\n');

  if (line[0] !== '{')
    return emit(line + '\n'); // not JSON

  try {
    rec = JSON.parse(line);
  } catch (e) {
    return emit(line + '\n');
  }

  if (!isValidRecord(rec))
    return emit(line + '\n');

  return emitRecord(rec, line);
}

function emit(str) {
  return stderr.write(str);
}


function emitRecord(rec, line) {
  return logStream.write(rec);
}

function processStdin() {
  var leftover = ''; // Left-over partial line from last chunk.

  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.pipe(stdout);

  stdin.on('data', function (chunk) {
    var lines = chunk.split(/\r\n|\n/);
    var length = lines.length;

    if (length === 1) {
      leftover += lines[0];
      return;
    }

    if (length > 1) {
      handleLogLine(leftover + lines[0]);
    }

    leftover = lines.pop();
    length -= 1;

    for (var i = 1; i < length; i++) {
      handleLogLine(lines[i]);
    }
  });

  stdin.on('end', function () {
    if (leftover) {
      handleLogLine(leftover);
      leftover = '';
    }
  });
}

processStdin();
