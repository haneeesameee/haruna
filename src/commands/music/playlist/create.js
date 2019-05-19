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
		const pls = await Playlist.create({
			user: message.author.id,
			guild: message.guild.id,
			name: playlist,
			description: info ? Util.cleanContent(info, message) : ''
		});

		return message.util.reply(`successfully created **${pls.name}**`);
	}
}

module.exports = PlaylistCreateCommand;
