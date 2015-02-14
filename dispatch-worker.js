var state;

function range(start, end, step) {
	step = step || 1;
	r = [];
	for(var i = start; i < end; i+=step) {
		r.push(i);
	}
	return r;
}

onmessage = function(event) {
	var message = event.data;

	switch(message.type) {
		case 'init':
			state = {
				'queue': range(0, message.chunks),
				'processing': []
			};
			postMessage({
				'type': 'init',
			});
			break;
		
		case 'status':
			postMessage({
				'type': 'status',
				'status': state,
			});
			break;
		
		case 'next':
			next = state['queue'].shift();
			state['processing'].push(next);
			postMessage({
				'type': 'next',
				'next': next,
			});
			break;
		
		case 'success':
			state['processing'] = state['processing'].filter(function(idx) {
				return idx != message.index;
			});
			if(!state['processing'].length) postMessage({
				'type': 'success',
			});
			break;

		case 'enqueue':
			state['queue'].push(message.index).sort();
			break;
		
		default:
			postMessage({
				'type': 'error',
				'error': new Error('Not implemented in worker: ' + message.type);
			});
			break;
	}
}
