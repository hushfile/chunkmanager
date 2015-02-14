(function(root, factory) {
	if(typeof define === 'function' && define.amd){
		define(['chunkedfile'], factory);
	} else if(typeof exports === 'object') {
		module.exports = factory(require('chunkedfile.js'));
	} else {
		root.downloaddispatcher = factory(root.chunkedfile);
	}
}(this, function(ChunkedFile) {

	function FileInfo(config) {
		var self = this;

		self.id = config.id;
		self.chunks = config.chunks;
		self.cipher = config.cipher;

	}

	function FileInfo.prototype.fromId(id, success, error) {

	}

	function FileMetadata(config) {
		var self = this;
		self.id = config.id;
		self.name = config.name || 'hushfile.txt';
		self.type = config.type || 'text/plain';
	}

	function Metadata.prototype.fromId(id, success, error) {

	}

	function getApiFile(fileid, chunknumber, progress, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '/api/file?fileid='+fileid+'&chunknumber='+chunknumber);
		xhr.addEventListener("progress", progress, false);
		xhr.onload = function(e) {
			if(this.status == 200) {
				// decrypt the data
				if(success) success(xmr.responseText);
			} else {
				if(error) error(e);
			}
		}
		xhr.send()
	}

	// config: {
	// 	'chunks': [urls], 
	// 	'metadata': object, 
	// 	'paralel': number, 
	// 	'type': string, 
	// 	'onchunkprogress': function(json), 
	// 	'onchunkerror': function(json),
	//	'onchunkwrite': function(json, cb),
	// }
	function DownloadDispatcher(config) {
		var self = this;

		self.info = config.info;
		self.metadata = config.metadata;

		self.onprogress = config.onprogress;
		self.onerror = config.onerror;
		self.onloadend = config.onloadend;

		self.onchunkprogress = config.onpchunkrogress;
		self.onchunkerror = config.onchunkerror;
		self.onchunkwrite = config.onchunkwrite;	

		self.download = function(id, success, error) {
			var chunkedFile = new ChunkedFile(config.filename, 
											  {type: config.type});
			var scheduler = new Worker('schedule-worker.js');
			scheduler.onmessage = function(e) {
				var message = e.data;
				var state = []
				switch(message.type) {
					case 'next':
						getApiFile(message.id,
							message.next,
							function(e) {
								state[e.id] = e.event;

								if(self.onchunkprogress) {
									self.onchunkprogress(event, state);
								}
							},
							function(event) {
								if(self.onchunkwrite) {
									self.onchunkwrite(event, function(chunk) {
										chunkedFile.addChunk(
											self.onchunkwrite(event), 
											function() {
												scheduler.postMessage({
													'type': 'next'
												});
										}, onchunkerror);
									});
									
								} else {
									chunkedFile.addChunk(chunk, function() {
										scheduler.postMessage({
											'type': 'next'
										});
									}, onchunkerror);
								}
								
							}, self.onchunkerror);

					case 'success':
						if(success) success(chunkedFile);
						break;

					case 'error':
						if(error) error(message.error); else throw message.error;
						break;

					default:
						var e = new Error('Illegel message type: ' + message.type);
						if(error) error(e); else throw e;
				}
			}
			scheduler.postMessage({
				'type': 'init',
				'chunks': self.info.chunks
			});
		}
	}
}));