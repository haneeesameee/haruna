const { Command } = require('discord-akairo');
const { Util } = require('discord.js');
const { Playlist } = require('../../../models/Playlists');

class PlaylistCreateCommand extends Command {
	constructor() {
		super('playlist-create', {
			category: 'music',
			description: {
				content: 'Creates a playlist.',
				usage: '<playlist> [info]'
			},
			channel: 'guild',
			ratelimit: 2,
			args: [
				{
					id: 'playlist',
					type: 'existingPlaylist',
					prompt: {
						start: message => `${message.author}, what playlist do you want to create?`,
						retry: (message, { failure }) => `${message.author}, a playlist with the name **${failure.value}** already exists.`
					}
				},
				{
					id: 'info',
					match: 'rest',
					type: 'string'
				}
			]
		});
	}

	async exec(message, { playlist, info }) {
		const playlistRepo = this.client.db.getRepository(Playlist);
		const pls = new Playlist();
		pls.user = message.author.id;
		pls.guild = message.guild.id;
		pls.name = playlist;
		if (info) pls.description = Util.cleanContent(info, message);
		await playlistRepo.save(pls);

		return message.util.reply(`successfully created **${pls.name}**.`);
	}
}

module.exports = PlaylistCreateCommand;