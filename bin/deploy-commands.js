const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

// and deploy your commands!
(async () => {
	try {
		if (!CLIENT_ID) {
			throw new Error(
				'Client ID is required to deploy commands, aborting',
			);
		}
		const SET_COMMANDS_ROUTE = GUILD_ID
			? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
			: Routes.applicationCommands(CLIENT_ID);
		console.log(
			`Refreshing ${commands.length} application (/) commands ${
				GUILD_ID ? `for guild ${GUILD_ID}` : `for client ${CLIENT_ID}`
			}`,
		);
		const data = await rest.put(SET_COMMANDS_ROUTE, { body: commands });
		console.log(
			`Successfully reloaded ${data.length} application (/) commands.`,
		);
		process.exit();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
