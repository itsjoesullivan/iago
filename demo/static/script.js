var Iago = require('../../index');
window.context = new AudioContext();

// Prepare the audio file
var request = new XMLHttpRequest();
request.open('GET', 'ff.wav', true);
request.responseType = 'arraybuffer';
request.onload = function() {
  context.decodeAudioData(request.response, function(buffer) {
    encode(buffer);
  }, function() { console.log('decodeError'); });
};
request.send();

function encode(buffer) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  var iago = new Iago(context);
  source.connect(iago.input);
  // Play the audio file.
  source.start(0);
  setTimeout(function() {
    source.stop();
    iago.getBlob().then(function(blob) {
      iago.download();
    });
  }, 5000);
}
