(function(root, factory) {
	if(typeof define === 'function' && define.amd){
		define(factory);
	} else if(typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.chunkmanager = factory;
	}
}(this, function() {

	// Mock of a Store implementation
	// Used to verify the interface and ChunkManager
	var MockStore = function() {
		var self = this;
		self.files = {};
		self.current = null;

		// Open the filename and set internal point to that file
		// filename: string - name of file
		// [success]: function - callback success
		// [error]: function - callback error
		self.open = function(filename, success, error) {
			if(!filename) {
				var e = new Error("Bad filename")
				if(error) error(e); else throw e;
			}
			if(!self.current) {
				self.current = filename;
				if(!self.files[filename]) {
					self.files[filename] = {'chunks': [], 'meta': {}};
				}
				if(success) success();
			} else {
				var e = new Error("Only one file can be opened at the time");
				if(error) error(e); else throw e;
			}
		}

		// Check if a file has been opened
		// [error]: function - callback if not open
		self._checkOpen = function(error) {
			if(!self.current) {
				var e = new Error("No open file");
				if(error) error(e); else throw e;
			}
		}

		// Close the current file pointer
		// [success]: function - callback on close
		// [error]: function - callback if no file is open
		self.close = function(success, error) {
			self._checkOpen(error);
			self.current = null;
			if(success) success();
		}

		// Set metadata for the current file
		// meta: object - object that will be used as argument for blob
		// [success]: function - callback on success
		// [error]: function - callback on error
		self.setMetadata = function(meta, success, error) {
			self._checkOpen(error);
			self.files[self.current]['meta'] = meta;
			if(success) success(); 
		}

		// Get the metadata object for the opened file
		// [success]: function
		// [error]: function
		self.getMetadata = function(success, error) {
			self._checkOpen(error);
			if(success) success(self.files[self.current]['meta']);
		}

		// Add a chunk
		// chunk: blob - contents of the cunk
		// [success]: function(index)
		// [error]: function
		// [index]: integer - if not set, chunk is appended
		self.set = function(chunk, success, error, index) {
			var i = index || self.files[self.current]['chunks'].length
			self._checkOpen(error);
			self.files[self.current]['chunks'][i] = chunk;

			if(success) success(i);
		}

		// Get a chunk
		// index: integer - The chunk to get
		// [success]: function - callback on success
		// [error]: function - callback on error
		self.get = function(index, success, error) {
			self._checkOpen(error);
			if(self.files[self.current]['chunks'][index]) {
				if(success) success(self.files[self.current]['chunks'][index]);	
			} else {
				var e = new Error("Chunk does not exist.");
				if(error) error(e); else throw e;
			}
		}

		// Remove chunk from open file
		// [success]: function - callback on success
		// [error]: function - callback on error
		self.remove = function(index, success, error) {
			self._checkOpen(error);
			try {
				delete self.files[self.current]['chunks'][index];
				if(success) succes();
			} catch(e) {
				if(error) error(e); else throw e;
			}
		}

		// Get a list of all the chunks
		// [success]: function([blob]) - callback on success
		// [error]: function - callback on error
		self.all = function(success, error) {
			self._checkOpen(error);
			if(success) success(self.files[self.current]['chunks']);
		}

		// Get all chunks combined into a single blob
		// [success]: function(blob)
		// [error]: function
		self.combine = function(success, error, indices) {
			self._checkOpen(error);
			var b;
			if(indices) {
				var blobs = []
				for(i in indices) {
					var chunk = self.files[self.current]['chunks'][i];
					if(!chunk) {
						var e = new Error("Chunk does not exist.");
						if(error) error(e); else throw e;
					} else {
						blobs[i] = chunk;
					}
				}
				b = new Blob(blobs, self.files[self.current])
			} else {
				b = new Blob(self.files[self.current]['chunks']);
			}
			if(success) success(b);
		}

		// Delete file from storage
		// filename: string - name of file to delete
		// [success]: function 
		// [error]: function
		self.delete = function(filename, success, error) {
			if(filename == self.current) {
				var e = new Error("Cannot delete open file");
				if(error) error(e); else throw e;
			}
			try{
				delete self.files[filename];
			} catch(e) {
				if(error) error(e); else throw e;
			}
		}
	}

	// Public API to handle split and collection of chunks
	function ChunkManager(config) {
		var self = this;
		self.config = config || {};

		self.chunksize = config.chunksize || 1024*1024; //
		self.filename = config.filename || "afdgsdgsgsagsfg"; //this should be randomized

		self.addChunk = function(index, content) {
			self.store.append(content);
		}

		self.getChunk = function(index) {
			return self.store.get(index);
		}

		self.splitFile = function(file, success, error) {
			var size = file.size;

			var append = function(start) {
				if(start < size) {
					var end = start + self.chunksize;
					var b = file.slice(start, end, file.type);
					self.store.set(b, function() {
						append(end);
					}, error);	
				} else {
					if(success) success();
				}
			}
			self.store.setMetadata({'type': file.type}, function() {
				append(0);	
			}, error);
		}

		self.joinFile = function(success, error) {
			self.store.combine(function(b) {
				if(success) success(URL.createObjectURL(b));
			}, error);
		}

		self.close = function() {
			self.store.close();
		}

		self.store = new MockStore();
		self.store.open(self.filename, config.onload, config.onerror);
	}

	return ChunkManager;
}));