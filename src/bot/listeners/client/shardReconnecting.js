const { Listener } = require('discord-akairo');

class ShardReconnectListener extends Listener {
	constructor() {
		super('shardReconnecting', {
			emitter: 'client',
			event: 'shardReconnecting',
			category: 'client'
		});
	}

	exec(id) {
		this.client.logger.info(`[SHARD ${id} RECONNECTING] Firepower--full force!!`);
		this.client.promServer.close();
		this.client.logger.info(`[SHARD ${id} RECONNECTING][METRICS] Metrics server closed.`);
	}
}

module.exports = ShardReconnectListener;
