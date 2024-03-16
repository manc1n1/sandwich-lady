const { SlashCommandBuilder } = require('discord.js');

const dropTable = [
	{ item: 'Chocolate bar', chance: 1 / 7 },
	{ item: 'Kebab', chance: 1 / 7 },
	{ item: 'Meat pie', chance: 1 / 7 },
	{ item: 'Roll', chance: 1 / 7 },
	{ item: 'Square sandwich', chance: 1 / 7 },
	{ item: 'Triangle sandwich', chance: 1 / 7 },
	{ item: 'Baguette', chance: 1 / 7.111 },
];

const baguetteTable = [{ item: 'Stale baguette', chance: 1 / 64 }];

function getRandomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function rollItem() {
	let max = 0;
	// Cumulative max chance (0.9977700544428147)
	for (const drop of dropTable) {
		max += drop.chance;
	}
	const randomNumber = getRandomNumber(0, max);
	let cumulativeChance = 0;
	for (const drop of dropTable) {
		cumulativeChance += drop.chance;
		if (randomNumber < cumulativeChance) {
			if (drop.item === 'Baguette') {
				const staleBaguetteRoll = getRandomNumber(0, 1);
				if (staleBaguetteRoll < baguetteTable[0].chance) {
					return baguetteTable[0].item;
				} else {
					// If not Stale baguette, return Baguette
					return drop.item;
				}
			} else {
				// If item is not Baguette, return the item
				return drop.item;
			}
		}
	}
	// If for some reason no item was selected, return null
	return null;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Try your luck for a Stale baguette'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		try {
			const guild = interaction.guild;
			const member = guild.members.cache.get(interaction.user.id);
			await interaction.followUp(
				`${member} recieved 1x **${rollItem()}**`,
			);
		} catch (err) {
			console.error(`Error: ${err.message}`);
			await interaction.followUp(`*Error: ${err.message}*`);
			return;
		}
	},
};