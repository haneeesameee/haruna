const { join } = require('path')
const { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler, Flag } = require('discord-akairo');
const { Util } = require('discord.js');
const { Client : Lavaqueue } = require('lavaqueue');
const { Logger, createLogger, transports, format } = require('winston');
const DailyRotateFile = ('winston-daily-rotate-file');
const { ReferenceType, Rejects } = require('rejects');
const Database = require('../structures/Database');
const SettingsProvider = require('../structures/SettingsProvider')
const { Setting } = require('../models/Settings');
const { Playlist } = require('../models/Playlists');
const { Counter, register } = require('prom-client');
const { createServer, Server } = require('http');
const { parse } = require('url');
const Raven = require('raven');


class Client extends AkairoClient {
	constructor(config) {
		super({ ownerID: config.owner }, {
			disableEveryone: true,
			disabledEvents: ['TYPING_START']
		});

		this.logger = createLogger({
			format: format.combine(
				format.colorize({ level: true }),
				format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
				format.printf(info => {
					const { timestamp, level, message, ...rest } = info;
					return `[${timestamp}] ${level}: ${message}${Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : ''}`;
				})
			),
			transports: [
				new transports.Console({ level: 'info' }),
				new DailyRotateFile({
					format: format.combine(
						format.timestamp(),
						format.json()
					),
					level: 'debug',
					filename: 'haruna-%DATE%.log',
					maxFiles: '14d'
				})
			]
		});
	
		this.music = new Lavaqueue({
			userID: process.env.ID,
			password: process.env.LAVALINK_PASSWORD,
			hosts: {
				rest: process.env.LAVALINK_REST,
				ws: process.env.LAVALINK_WS,
				redis: process.env.REDIS ? {
					port: 6379,
					host: process.env.REDIS,
					db: 0
				} : undefined
			},
			send: async (guild, packet) => {
				const shardGuild = this.guilds.get(guild);
				if (shardGuild) return shardGuild.shard.send(packet);
				return Promise.resolve();
			}
		});
	
		this.storage = new Rejects(this.music.queues.redis);
	
		this.commandHandler = new CommandHandler(this, {
			directory: join(__dirname, '..', 'commands'),
			prefix: ['🎶', '🎵', '🎼', '🎹', '🎺', '🎻', '🎷', '🎸', '🎤', '🎧', '🥁'],
			aliasReplacement: /-/g,
			allowMention: true,
			handleEdits: true,
			commandUtil: true,
			commandUtilLifetime: 3e5,
			defaultCooldown: 3000,
			argumentDefaults: {
				prompt: {
					modifyStart: (_, str) => `${str}\n\nType \`cancel\` to cancel the command.`,
					modifyRetry: (_, str) => `${str}\n\nType \`cancel\` to cancel the command.`,
					timeout: 'Guess you took too long, the command has been cancelled.',
					ended: "More than 3 tries and you still didn't quite get it. The command has been cancelled",
					cancel: 'The command has been cancelled.',
					retries: 3,
					time: 30000
				},
				otherwise: ''
			}
		});
		this.inhibitorHandler = new InhibitorHandler(this, { directory: join(__dirname, '..', 'inhibitors') });
	
		this.listenerHandler = new ListenerHandler(this, { directory: join(__dirname, '..', 'listeners') });
	
		this.prometheus = {
			messagesCounter: new Counter({ name: 'haruna_messages_total', help: 'Total number of messages Haruna has seen' }),
			commandCounter: new Counter({ name: 'haruna_commands_total', help: 'Total number of commands used' }),
			register
		};
	
		this.promServer = createServer((req, res) => {
			if (parse(req.url).pathname === '/metrics') {
				res.writeHead(200, { 'Content-Type': this.prometheus.register.contentType });
				res.write(this.prometheus.register.metrics());
			}
			res.end();
		});

		this.on('raw', async packet => {
			switch (packet.t) {
				case 'VOICE_STATE_UPDATE':
					if (packet.d.user_id !== process.env.ID) return;
					this.music.voiceStateUpdate(packet.d);
					const players = await this.storage.get('players', { type: ReferenceType.ARRAY });
					let index = 0;
					if (Array.isArray(players)) index = players.findIndex(player => player.guild_id === packet.d.guild_id);
					if (((!players && !index) || index < 0) && packet.d.channel_id) {
						this.storage.upsert('players', [{ guild_id: packet.d.guild_id, channel_id: packet.d.channel_id }]);
					} else if (players && typeof index !== 'undefined' && index >= 0 && !packet.d.channel_id) {
						players.splice(index, 1);
						await this.storage.delete('players');
						if (players.length) await this.storage.set('players', players);
					}
					break;
				case 'VOICE_SERVER_UPDATE':
					this.music.voiceServerUpdate(packet.d);
					break;
				case 'MESSAGE_CREATE':
					this.prometheus.messagesCounter.inc();
					break;
				default: break;
			}
		});

		this.commandHandler.resolver.addType('playlist', async (message, phrase) => {
			if (!phrase) return Flag.fail(phrase);
			phrase = Util.cleanContent(phrase.toLowerCase(), message);
			const playlistRepo = this.db.getRepository(Playlist);
			const playlist = await playlistRepo.findOne({ name: phrase, guild: message.guild.id });

			return playlist || Flag.fail(phrase);
		});
		this.commandHandler.resolver.addType('existingPlaylist', async (message, phrase) => {
			if (!phrase) return Flag.fail(phrase);
			phrase = Util.cleanContent(phrase.toLowerCase(), message);
			const playlistRepo = this.db.getRepository(Playlist);
			const playlist = await playlistRepo.findOne({ name: phrase, guild: message.guild.id });

			return playlist ? Flag.fail(phrase) : phrase;
		});

		this.config = config;

		if (process.env.RAVEN) {
			Raven.config(process.env.RAVEN, {
				captureUnhandledRejections: true,
				autoBreadcrumbs: true,
				environment: process.env.NODE_ENV,
				release: '0.1.0'
			}).install();
		} else {
			process.on('unhandledRejection', err => this.logger.error(`[UNHANDLED REJECTION] ${err.message}`, err.stack));
		}
	}

	async _init() {
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler
		});

		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();

		this.settings = new SettingsProvider(Setting);
		await Database.authenticate();
		await this.settings.init();
	}

	async start() {
		await this._init();
		return this.login(this.config.token);
	}
}

module.exports = Client;
