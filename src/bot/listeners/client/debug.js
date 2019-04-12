const { Listener } = require('discord-akairo');

class DebugListener extends Listener {
	constructor() {
		super('debug', {
			emitter: 'client',
			event: 'debug',
			category: 'client'
		});
	}

	exec(event) {
		this.client.logger.debug(`[DEBUG] ${event}`);
	}
}

module.exports = DebugListener;