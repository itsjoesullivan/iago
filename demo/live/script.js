window.context = new AudioContext();

navigator.webkitGetUserMedia({audio: true}, function(mediaStream) {
  var src = context.createMediaStreamSource(mediaStream);
  encode(src);
}, function() {});

var Iago = require('../../index');

function encode(source) {
  source.connect(context.destination);
  var iago = new Iago(source);
  source.connect(iago.input);
  setTimeout(function() {
    iago.getBlob().then(function(blob) {
      iago.download();
    });
  }, 5 * 1000);

}
