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