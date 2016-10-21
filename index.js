console.log("Connecting to Server...");

var shoe = require('shoe');
var through = require('through');

var result = document.getElementById('result');

var stream = shoe('/connect');
stream.pipe(through(function (msg) {
    result.appendChild(document.createTextNode(msg));
    this.queue(String(Number(msg)^1));
})).pipe(stream);