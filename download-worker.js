function getApiFile(fileid, chunknumber, progress, success, error) {
	var xhr = new XMLHttpRequest();
	
	xhr.onload = function(e) {
		if(this.status == 200) {
			if(success) success(xmr.response);
		} else {
			if(error) error(e);
		}
	}

	var url = '/api/file?fileid='+fileid+'&chunknumber='+chunknumber
	xhr.open('GET', url);
	xhr.responseType = "json";
	xmr.send()
}

onmessage = function(event) {
	var message = event.data;

	switch(message.type) {
		case 'init':
			getApiFile(message.id, message.index, function(e) {
				postMessage({
					'type': 'progress',
					'id': message.id,
					'index': message.index,
					'event': e,
				});
			}, function())
			break;


		default:
			var e = new Error('Illegal message type: ' + message.type);
			postMessage({
				'type': 'error',
				'error': e,
			});
	}
}