var Iago = require('iago');

window.context = new AudioContext();

navigator.mozGetUserMedia({audio: true}, function(mediaStream) {
  var src = context.createMediaStreamSource( mediaStream );
  encode( src );

}, function() {});

function encode( source ) {

  source.connect(context.destination);
  var iago = new Iago();
  source.connect(iago.input);
  setTimeout(function() {
    iago.getBlob();
    var b = iago.download();
    console.log(b);
    //d.stop();
    //var b = d.getBlob();
  }, 5000);

}
