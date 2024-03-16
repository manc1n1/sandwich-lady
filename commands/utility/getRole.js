const { SlashCommandBuilder } = require('discord.js');
const hiscores = require('osrs-json-hiscores');

class CustomError extends Error {
	constructor(message) {
		super(message);
	}
}

function sanitizeRSN(rsn) {
	return rsn.replace(/[ _-]/g, '_').toLowerCase();
}

let rank, totalLvl;
async function fetchHiscores(rsn) {
	const res = await hiscores.getStats(rsn);
	rank = res.main.skills.overall.rank;
	totalLvl = res.main.skills.overall.level;
}

const roleMapping = {
	2277: '1070071993845694485',
	2199: '1070072215732764742',
	2099: '1070072519148716154',
	1999: '1070072837576069252',
	1749: '1070073018853900389',
	1499: '1070073226807476295',
	1249: '1070073450787516577',
	999: '1070073537068535858',
};

async function removeOtherRoles(member, total) {
	const rolesToRemove = [];
	for (const [condition, roleId] of Object.entries(roleMapping)) {
		if (condition <= total) {
			rolesToRemove.push(roleId);
		}
	}
	await member.roles.remove(rolesToRemove);
}

function determineRole(total) {
	const roleKeys = Object.keys(roleMapping).sort((a, b) => b - a);
	for (let i = 0; i < roleKeys.length; i++) {
		if (total >= roleKeys[i]) {
			return roleMapping[roleKeys[i]];
		}
	}
	throw new CustomError(
		'No role assigned, need at least **Total Level: 1000**',
	);
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
		// await interaction.deferReply({ ephemeral: true });
		await interaction.deferReply();
		const rawRsn = interaction.options.getString('rsn');
		const rsn = sanitizeRSN(rawRsn);
		try {
			await fetchHiscores(rsn);
			const guild = interaction.guild;
			const member = guild.members.cache.get(interaction.user.id);
			await removeOtherRoles(member, totalLvl);
			const roleToAdd = determineRole(totalLvl);
			await member.roles.add(roleToAdd);
			await interaction.followUp(
				`*RSN:* **${rsn}**\n*Overall Rank:* **${rank}**\n*Total Level:* **${totalLvl}**\n*Role:* <@&${roleToAdd}>`,
			);
		} catch (err) {
			console.error(`Error fetching hiscores: ${err.message}`);
			await interaction.followUp(
				`*Error fetching hiscores:* **${rsn}**\n*${err.message}*`,
			);
			return;
		}
	},
};
