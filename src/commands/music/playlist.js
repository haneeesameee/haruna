const { Command, Flag } = require('discord-akairo');

class PlaylistCommand extends Command {
	constructor() {
		super('playlist', {
			aliases: ['playlist', 'pl'],
			description: {
				content: [
					'• create `<playlist>` `[info]`',
					'• add `<playlist>` `<link/playlist>`',
					'• load `<playlist>`',
					'• remove `<playlist>` `<position>`',
					'• edit `<playlist>` `<info>`',
					'• del `<playlist>`',
					'• show `<playlist>` `[page]`',
					'• info `<playlist>`',
					'• list `[member]` `[page]`',
				   'Required: `<>` | Optional: `[]`',
				   'For additional `<...arguments>` usage refer to the examples below.'
				],
				usage: '<method> <...arguments>',
				examples: [
					'create Test',
					'create Test Some additional description',
					'load Test',
					'add Test <link/playlist>',
					'remove Test 3',
					'edit Test Some other additional info',
					'show Test',
					'show Test 3',
					'info Test',
					'list Suvajit 2'
				]
			},
			category: 'music',
			channel: 'guild',
			ratelimit: 2
		});
	}

	*args() {
		const method = yield {
			type: [
				['playlist-show', 'show'],
				['playlist-create', 'create'],
				['playlist-add', 'add'],
				['playlist-load', 'load'],
				['playlist-remove', 'rm', 'remove'],
				['playlist-delete', 'del', 'delete'],
				['playlist-edit', 'edit'],
				['playlist-info', 'info'],
				['playlist-list', 'list']
			],
			otherwise: ''
		};

		return Flag.continue(method);
	}
}

module.exports = PlaylistCommand;
