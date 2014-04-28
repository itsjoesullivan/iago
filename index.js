var Thread = require('thread');

var Iago = module.exports = function(object) {

  this.thread = new Thread(function() {

    // Import vorbis into worker
    importScripts( 'http://local.scat.io:3000/vorbis.small.js' );

    // Initialize
    var state = Module._lexy_encoder_start(44100, 3);

    // On writes, write to vorbis
    thread.on('write', function(data) {

      var l = data[0];
      var r = data[1];

      var inbuf_l = Module._malloc(l.length*l.BYTES_PER_ELEMENT);
      Module.HEAPF32.set( l, inbuf_l>>2 );

      var inbuf_r = Module._malloc(r.length*r.BYTES_PER_ELEMENT);
      Module.HEAPF32.set( r, inbuf_r>>2 );

      Module._lexy_encoder_write( state, inbuf_l, inbuf_r, l.length );

      Module._free(inbuf_l);
      Module._free(inbuf_r);

    });

    thread.on('finish', function(e) {

      // Wrap up
      Module._lexy_encoder_finish( state );

      // Get pointer
      var ptr = Module._lexy_get_buffer( state );

      var oggData = new Uint8Array( Module.HEAPU8.subarray( ptr, 
        ptr + Module._lexy_get_buffer_length( state ) ) 
      );
      thread.send('blob', oggData);

    });
  });
  

  this.input = this.context.createScriptProcessor(4096, 2, 0);
  this.input.onaudioprocess = this.write.bind(this);
  this.input.connect(this.context.destination);

  if (object instanceof window.MediaStreamAudioSourceNode) {
    this.source = object;
    this.context = this.source.context;
    this.source.connect( this.input );
  }

};


Iago.prototype.write = function( e ) {

  if (this.done) {
    // No more writes"
    return;
  }

  this.thread.send('write', 
    e.inputBuffer.getChannelData(0),
    e.inputBuffer.getChannelData(1) );

};

Iago.prototype.getBlob = function(cb) {

  if (this.blob) {
    return cb( null, this.blob );
  }

  this.done = true;

  this.thread.on('blob', function( data ) {
    this.blob = new Blob( [ data ], {
      type: 'audio/ogg'
    });
    cb( null, this.blob );
  }.bind(this));

  this.thread.send('finish');

};

Iago.prototype.download = function() {

  // Download
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(this.blob);
  a.download = 'test.ogg';
  document.body.appendChild(a);
  a.click();

};




