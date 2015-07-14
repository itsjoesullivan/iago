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
