(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../../index":2}],2:[function(require,module,exports){
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

Iago.prototype.download = function() {
  // Download
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(this.blob);
  a.download = 'test.ogg';
  document.body.appendChild(a);
  a.click();
};

},{"./lib/thread":4}],3:[function(require,module,exports){
module.exports = function() {};

/** 
 * Add a listener by event name
 * @param {String} name
 * @param {Function} fn
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.on = function(name,fn) {

	//Lazy instanciation of events object
	var events = this.events = this.events || {};

	//Lazy instanciation of specific event
  events[name] = events[name] || [];

  //Give it the function
  events[name].push(fn);

  return this;

};


/** 
 * Trigger an event by name, passing arguments
 * 
 * @param {String} name
 * @return {Event} instance
 * @api public
 */
module.exports.prototype.trigger = function(name, arg1, arg2 /** ... */) {

	//Only if events + this event exist...
  if(!this.events || !this.events[name]) return this;

  //Grab the listeners
  var listeners = this.events[name],
    //All arguments after the name should be passed to the function
  	args = Array.prototype.slice.call(arguments,1);

  //So we can efficiently apply below
  function triggerFunction(fn) {
  	fn.apply(this,args);
  };

  if('forEach' in listeners) {
  	listeners.forEach(triggerFunction.bind(this));
  } else {
  	for(var i in listeners) {
  	  if(listeners.hasOwnProperty(i)) triggerFunction(fn);
  	}
  }

  return this;

};
},{}],4:[function(require,module,exports){
var Event = require('./event');

/** Create a new thread
*/
var Thread = function(workerObject) {

	//Convert worker object to a string
	var objectString = this.stringifyObject(workerObject);

	//Turn it into an immediately-executing function
	var workerString = this.encloseString(objectString);

	var workerWithHelper = this.prependHelpers(workerString);

	//Make a blob of it
	var blob = new Blob([workerWithHelper], {type: 'text/javascript'});

	//Create a worker pointed at the blob
	this.worker = new Worker(window.URL.createObjectURL(blob));

	this.worker.addEventListener('message', function(e) {
		if(typeof e.data === 'object' && 'type' in e.data && e.data.type === 'thread.send') {
			this.trigger.apply(this,[e.data.name].concat(e.data.args));
		} else {
			this.trigger('message',e.data,e);
		}
	}.bind(this));

	return this;
};

Thread.prototype = new Event();

Thread.prototype.send = function(name,arg1,arg2 /* ... */) {
	var obj = {
		type: 'thread.send',
		name: name,
		args: Array.prototype.slice.call(arguments,1)
	};
	this.worker.postMessage.apply(this.worker,[obj]);
};

/**
 * Turn object into string.
 */
Thread.prototype.stringifyObject = function(workerObject) {
	if(typeof workerObject === 'function') {
		return workerObject.toString();
	}
	var workerString = '{\n';
	for(var i in workerObject) {
		workerString += '\t' + i + ': ' + this.stringifyObject(workerObject[i]) + ',\n';
	}
	workerString = workerString.substring(0,workerString.length-2) + '\n';
	workerString += '};';
	return workerString;
};

/**
 * Turn string into immediately-executing function string
 */
Thread.prototype.encloseString = function(workerString) {

	return '(' + workerString + ')()';

};

Thread.prototype.prependHelpers = function(workerString) {

	var helpers = 'onmessage = ' + function(e) {
		if(e.data.type === 'thread.send') {
			thread.trigger(e.data.name,e.data.args);
		} else {
			postMessage(e.data);
		}
	}.toString() + '\n' +
	'thread = {' + 
		'send: ' + function(name,arg1,arg2) { 
			postMessage({
				name: name,
				args: Array.prototype.slice.call(arguments,1),
				type: 'thread.send'
			});
		}.toString() + ', \n' + 
		'on: ' + Event.prototype.on.toString() + ',\n' +
		'trigger: ' + Event.prototype.trigger.toString() + '\n' + 
	'};\n';

	return helpers + '\n' + workerString;
};

module.exports = Thread;

},{"./event":3}]},{},[1]);
