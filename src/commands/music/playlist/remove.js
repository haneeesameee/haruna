const { Argument, Command } = require('discord-akairo');

class PlaylistRemoveCommand extends Command {
	constructor() {
		super('playlist-remove', {
			description: {
				content: 'Removes a song from the playlist.',
				usage: '<playlist> <position>',
				examples: []
			},
			category: 'music',
			channel: 'guild',
			ratelimit: 2,
			args: [
				{
					id: 'playlist',
					type: 'playlist',
					prompt: {
						start: message => `${message.author}, what playlist should this song/playlist be removed from?`,
						retry: (message, { failure }) => `${message.author}, a playlist with the name **${failure.value}** does not exist.`
					}
				},
				{
					id: 'position',
					match: 'rest',
					type: Argument.compose((_, str) => str.replace(/\s/g, ''), Argument.range(Argument.union('number', 'emojint'), 1, Infinity)),
					default: 1
				}
			]
		});
	}

	async exec(message, { playlist, position }) {
		if (playlist.user !== message.author.id) return message.util.reply('you can only remove songs from your own playlists.');
		position = position >= 1 ? position - 1 : playlist.songs.length - (~position + 1);
		const decoded = await this.client.music.decode([playlist.songs[position]]);

		const newTracks = await playlist.songs.filter(id => id !== decoded[0].track);
		await playlist.update({ songs: newTracks });

		return message.util.send(`${this.client.emojis.get('479430354759843841')} **Removed:** \`${decoded[0].info.title}\``);
	}
}

module.exports = PlaylistRemoveCommand;
