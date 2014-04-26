Module.TOTAL_MEMORY = 16777216 * 4;

var Iago = module.exports = function() {

  this.input = context.createScriptProcessor(1024, 2, 2);
  this.input.onaudioprocess = this.write.bind(this);

  this.state = _lexy_encoder_start(44100, 3);

};


Iago.prototype.write = function( e ) {
  if (this.done) {
    throw "No more writes.";
  }

  var buffers = [ e.inputBuffer.getChannelData(0), e.inputBuffer.getChannelData(1) ];

  // Grab data
  var inbuf_l = _malloc(buffers[0].length * 4);
  var inbuf_r = _malloc(buffers[1].length * 4);
  for (var i=0;i<buffers[0].length;i++) {
    setValue(inbuf_l + (i*4), buffers[0][i], 'float');
    setValue(inbuf_r + (i*4), buffers[1][i], 'float');
  }

  // Write data
  _lexy_encoder_write( this.state, inbuf_l, inbuf_r, buffers[0].length );

};

Iago.prototype.getBlob = function() {

  if (this.blob) {
    return this.blob;
  }

  this.done = true;

  // Wrap up
  _lexy_encoder_finish( this.state );

  // Get pointer
  var ptr = _lexy_get_buffer( this.state );

  var oggData = new Uint8Array( Module.HEAPU8.subarray( ptr, 
    ptr + _lexy_get_buffer_length( this.state ) ) 
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




