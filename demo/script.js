var Iago = require('iago');

window.context = new AudioContext();
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
  //var d = new Dub( source );
  //d.start();
  var iago = new Iago();
  source.connect(iago.input);
  source.start(0);
  setTimeout(function() {
    iago.getBlob();
    var b = iago.download();
    source.stop();
    console.log(b);
    //d.stop();
    //var b = d.getBlob();
  }, 5000);

}
