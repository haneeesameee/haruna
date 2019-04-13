const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');

class HelpCommand extends Command {
	constructor() {
		super('help', {
			aliases: ['help'],
			description: {
				content: 'Displays a list of available commands, or detailed information for a specified command.',
				usage: '[command]'
			},
			category: 'util',
			clientPermissions: ['EMBED_LINKS'],
			ratelimit: 2,
			args: [
				{
					id: 'command',
					type: 'commandAlias'
				}
			]
		});
	}

	async exec(message, { command }) {
		const prefix = (this.handler.prefix)[0];
		if (!command) {
			const embed = new MessageEmbed()
				.setColor(3447003)
				.addField('❯ Commands', [`A list of available commands.`,
					`For additional info on a command, type \`${prefix}help <command>\``
				]);

			for (const category of this.handler.categories.values()) {
				embed.addField(`❯ ${category.id.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`, `${category.filter(cmd => cmd.aliases.length > 0).map(cmd => `\`${cmd.aliases[0]}\``).join(' ')}`);
			}

			return message.util.send(embed);
		}

		const embed = new MessageEmbed()
			.setColor(3447003)
			.setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
			.addField('❯ Description', command.description.content || '\u200b');

		if (command.aliases.length > 1) embed.addField('❯ Aliases', `\`${command.aliases.join('` `')}\``, true);
		if (command.description.examples && command.description.examples.length) embed.addField('❯ Examples', `\`${prefix}${command.aliases[0]} ${command.description.examples.join(`\`\n\`${command.aliases[0]} `)}\``, true);

		return message.util.send(embed);
	}
}

module.exports = HelpCommand;