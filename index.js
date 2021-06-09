'use strict';

const serialize = require('serialize-error');

exports.handler = async (event, context) => {
	try {
		const items = event.Records;
		
		return {message: `${items.length} items(s) received`};
	}
	catch (error) {
		log.error('Could not update item(s)', { event });

		console.log(JSON.stringify({
			time : new Date().toISOString(),
			level: 'ERROR',
			message: 'Could not update item(s)',
			awsRequestId: context.awsRequestId,			
			meta: serialize(event),
		}));

		throw error;
	}
};
