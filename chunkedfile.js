(function(root, factory) {
	if(typeof define === 'function' && define.amd){
		define(factory);
	} else if(typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.chunkmanager = factory;
	}
}(this, function() {

	//config: {"filename": string, "metadata": {"type": string}}
	function ChunkedFile(config, success, error) {
		var self = this;
		self.filename = config.filename;
		config.metadata = config.metadata || {type: "text/plain"};
		self.chunkIndices = []; //array of chunk indexes
		self.chunks = [];

		self.size = function() {
			return self.chunks.length;
		}

		self.addChunk = function(chunk, success, error, index) {
			if(!index) index = self.size();
			self.chunks[index] = chunk;
			console.log("Added chunk");
			if(success) success(index);
		}

		self.getChunk = function(index, success, error) {
			var chunk = self.chunks[index];
			if(chunk) {
				if(success) success(chunk);
			} else {
				var e = new Error("Chunk with index " + index + " not found");
				if(error) error(e); else throw e;
			}
			self.store.get(index, function(chunk) {
				if(success) success(chunk);
			}, error);
		}

		self.getFile = function(success, error, indices) {
			var chunks = self.chunks;
			if(indices) {
				chunks = [];
				for(i in indices) {
					var chunk = self.chunks[i];
					if(chunk) {
						chunks.push(chunk);
					} else {
						var e = new Error("Chunk with index " + index + " not found");
						if(error) error(e); else throw e;
						return;
					}
				}
			}
			var file;

			try {
				file = new File(chunks, config.filename, config.metadata);
			} catch (e) {
				file = new Blob(chunks, config.metadata);
			}

			if(success) success(file);
		}

		self.close = function() {
			self.store.close();
		}
	}

	var splitWorker = URL.createObjectURL(new Blob(['(',function() {
		onmessage = function(event) {
			var message = event.data;
			var blob = message.file;
			var chunksize = message.chunksize;
			var start = 0;

			while(start < blob.size) {
				var end = start + chunksize;
				postMessage({
					'chunk': blob.slice(start, end, blob.type),
					'type': 'chunk'
				});
				start = end;
			}
			postMessage({
				'type': 'success'
			})
		}
	}.toString(),')()'], {type: 'application/javascript'}));

	ChunkedFile.fromFile = function(args, success, error) {
		//args can be the just file as well, check typeof
		if(!args.file) {
			var e = new Error("File is not defined");
			if(error) error(e); else throw e;
		}
		var file = args.file;
		args.chunksize = args.chunksize || 1024*1024;

		var chunkedFile = new ChunkedFile({
			"filename": file.name,
			"metadata": {type: file.type}
		});
		var worker = new Worker(splitWorker);
		worker.onmessage = function(event) {
			var message = event.data;

			switch(message.type) {
				case 'chunk':	
					console.log("Received chunk");
					chunkedFile.addChunk(message.chunk);
				break;

				case 'success':
					worker.terminate();
					if(success) success(chunkedFile);
				break;						
			}
		}
		worker.postMessage(args);
	}

	return ChunkedFile;
}));
