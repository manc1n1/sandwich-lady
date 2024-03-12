const { SlashCommandBuilder } = require('discord.js');
const hiscores = require('osrs-json-hiscores');

let rank = 0;
let totalLvl = 0;

function sanitizeRSN(rsn) {
	return rsn.replace(/[ _-]/g, '_').toLowerCase();
}

async function fetchHiscores(rsn) {
	const res = await hiscores.getStats(rsn);
	rank = res.main.skills.overall.rank;
	totalLvl = res.main.skills.overall.level;
}

function determineRole(total) {
	if (total == 2277) {
		return '1070071993845694485';
	} else if (total > 2199) {
		return '1070072215732764742';
	} else if (total > 2099) {
		return '1070072519148716154';
	} else if (total > 1999) {
		return '1070072837576069252';
	} else if (total > 1749) {
		return '1070073018853900389';
	} else if (total > 1499) {
		return '1070073226807476295';
	} else if (total > 1249) {
		return '1070073450787516577';
	} else if (total > 999) {
		return '1070073537068535858';
	} else {
		return;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getrole')
		.setDescription('Assigns role determined by RSN Total Level')
		.addStringOption((option) =>
			option
				.setName('rsn')
				.setDescription('RuneScape Name')
				.setRequired(true),
		),
	async execute(interaction) {
		const rawRsn = interaction.options.getString('rsn');
		const rsn = sanitizeRSN(rawRsn);
		try {
			await fetchHiscores(rsn);
			const guild = interaction.guild;
			const member = guild.members.cache.get(interaction.user.id);
			const roleToAdd = determineRole(totalLvl);
			await member.roles.add(roleToAdd);
			await interaction.deferReply({ ephemeral: true });
			await interaction.editReply(
				`*RSN:* **${rsn}**\n*Overall Rank:* **${rank}**\n*Total Level:* **${totalLvl}**\n*Role:* <@&${roleToAdd}>`,
			);
			totalLvl = 0;
			rank = 0;
		} catch (err) {
			console.error(`Error fetching hiscores: ${err.message}`);
			await interaction.deferReply({ ephemeral: true });
			await interaction.editReply(
				`*Error fetching hiscores:* **${rsn}**\n*${err.message}*`,
			);
			return;
		}
	},
};