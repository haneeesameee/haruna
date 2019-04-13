const { Listener } = require('discord-akairo');

class ShardResumeListener extends Listener {
	constructor() {
		super('shardResumed', {
			emitter: 'client',
			event: 'shardResumed',
			category: 'client'
		});
	}

	exec(id) {
		this.client.logger.info(`[SHARD ${id} RESUMED] Alright, next time I'll--Eh...again...?`);
		this.client.promServer.listen(5501);
		this.client.logger.info(`[SHARD ${id} RESUMED][METRICS] Metrics listening on 5501`);
	}
}

module.exports = ShardResumeListener;
