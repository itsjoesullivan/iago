
var Iago = module.exports = function(object) {
  if(! window.Module ) {
    require('./vorbis.small.js');
  }

  // Handle AudioBuffers immediately?
  if (object instanceof window.AudioBuffer) {
    this.buffer = object;
    this.state = Module._lexy_encoder_start(44100, 3);
    var len = this.buffer.length;
    var pos = 0;
    var end = len;
    var one = function(i) {
      return this.buffer.getChannelData(i).subarray(pos, end);
    }.bind(this);
    while(len > pos) {
      end = pos + 4096;
      if(end > len) {
        end = len;
      }

      this.write({
        inputBuffer: {
          getChannelData: one
        }
      });
      pos = end;
    }
    this.getBlob();
    return;
  }
  
  if (object instanceof window.OfflineAudioContext) {
    this.context = object;
  } else if (object instanceof window.AudioContext) {
    this.context = object;
  } else if (object instanceof window.MediaStreamAudioSourceNode) {
    this.source = object;
    this.context = this.source.context;
  }

  this.input = this.context.createScriptProcessor(4096, 2, 0);
  this.input.onaudioprocess = this.write.bind(this);
  this.input.connect(this.context.destination);

  this.state = Module._lexy_encoder_start(44100, 1);

};


Iago.prototype.write = function( e ) {

  if (this.done) {
    // No more writes"
    return;
  }

  var l = e.inputBuffer.getChannelData(0);
  var r = e.inputBuffer.getChannelData(1);

  var inbuf_l = Module._malloc(l.length*l.BYTES_PER_ELEMENT);
  Module.HEAPF32.set( l, inbuf_l>>2 );

  var inbuf_r = Module._malloc(r.length*r.BYTES_PER_ELEMENT);
  Module.HEAPF32.set( r, inbuf_r>>2 );

  Module._lexy_encoder_write( this.state, inbuf_l, inbuf_r, l.length );

  Module._free(inbuf_l);
  Module._free(inbuf_r);
};

Iago.prototype.getBlob = function(cb) {

  if (this.blob) {
    return this.blob;
  }

  this.done = true;

  // Wrap up
  Module._lexy_encoder_finish( this.state );

  // Get pointer
  var ptr = Module._lexy_get_buffer( this.state );

  var oggData = new Uint8Array( Module.HEAPU8.subarray( ptr, 
    ptr + Module._lexy_get_buffer_length( this.state ) ) 
  );

  // Create blob
  this.blob = new Blob( [ oggData ], {
    type: 'audio/ogg'
  });
  return this.blob;
};

Iago.prototype.download = function() {

  // Download
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(this.blob);
  a.download = 'test.ogg';
  document.body.appendChild(a);
  a.click();

};




