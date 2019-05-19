const { Command } = require('discord-akairo');

const RESPONSES = [
	'No.',
	'Not happening.',
	'Maybe later.',
	`:ping_pong: Pong! \`$(ping)ms\`
		Heartbeat: \`$(heartbeat)ms\``,
	`Firepower--full force!! \`$(ping)ms\`
		Doki doki: \`$(heartbeat)ms\``,
	`A fierce battle makes me want to eat a bucket full of rice afterwards. \`$(ping)ms\`
		Heartbeat: \`$(heartbeat)ms\``,
	`This, this is a little embarrassing... \`$(ping)ms\`
		Heartbeat: \`$(heartbeat)ms\``
];

class PingCommand extends Command {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			description: {
				content: 'Checks the bot\'s ping to the Discord servers.'
			},
			category: 'util',
			ratelimit: 2
		});
	}

	async exec(message) {
		const msg = await message.util.send('Pinging ~ ~ ~');

		return message.util.send(
			RESPONSES[Math.floor(Math.random() * RESPONSES.length)]
				.replace('$(ping)', ((msg.editedTimestamp || msg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)).toString())
				.replace('$(heartbeat)', Math.round(this.client.ws.ping).toString())
		);
	}
}

module.exports = PingCommand;
