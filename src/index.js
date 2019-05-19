require('reflect-metadata');
require('dotenv').config();
const Client = require('./client/Client');

const client = new Client({ owner: process.env.OWNER, token: process.env.TOKEN });

client.on('error', err => client.logger.error(`[CLIENT ERROR] ${err.message}`, err.stack))
	.on('shardError', (err, id) => client.logger.error(`[SHARD ${id} ERROR] ${err.message}`, err.stack))
	.on('warn', warn => client.logger.warn(`[CLIENT WARN] ${warn}`));

client.start();
