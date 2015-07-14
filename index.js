var Thread = require('./lib/thread');

var Iago = module.exports = function(object) {

  // Remember: the function defined here will be evaluated in a worker.
  this.thread = new Thread(function() {
    // Import vorbis into worker
    importScripts( 'https://s3.amazonaws.com/scat/lib/iago/vorbis.js' );

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
      close();
    });
  });
  
  if (object instanceof window.MediaStreamAudioSourceNode) {
    this.source = object;
    this.context = this.source.context;
  } else if (object instanceof window.AudioContext) {
    this.context = object;
  }

  this.input = this.context.createScriptProcessor(4096, 2, 2);
  this.input.onaudioprocess = this.write.bind(this);
  this.input.connect(this.context.destination);

  if (object instanceof window.MediaStreamAudioSourceNode) {
    this.source.connect( this.input );
  }
};


Iago.prototype.write = function( e ) {
  if (this.done) {
    return;
  }
  this.thread.send('write', 
    e.inputBuffer.getChannelData(0),
    e.inputBuffer.getChannelData(1) );
};

Iago.prototype.getBlob = function(cb) {
  this.done;
  return new Promise(function(resolve, reject) {
    if (this.blob) {
      return resolve(this.blob);
    }
    this.thread.on('blob', function(data) {
      this.blob = new Blob([data], {
        type: 'audio/ogg'
      });
      resolve(this.blob);
    });
    this.thread.send('finish');
  }.bind(this));
  this.thread.on('blob', function( data ) {
    this.blob = new Blob( [ data ], {
      type: 'audio/ogg'
    });
    cb( null, this.blob );
  }.bind(this));
  this.thread.send('finish');
};

Iago.prototype.download = function(name) {
  // Download
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(this.blob);
  a.download = (name || 'test') + '.ogg';
  document.body.appendChild(a);
  a.click();
};
