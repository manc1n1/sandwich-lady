const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const db = new sqlite3.Database('./db/data.db');

db.serialize(() => {
	db.run(`
		CREATE TABLE IF NOT EXISTS guilds (
			id TEXT PRIMARY KEY,
			name TEXT
		)
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS members (
			id TEXT PRIMARY KEY,
			username TEXT,
			guild_id TEXT,
			FOREIGN KEY(guild_id) REFERENCES guilds(id)
		)
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS inventory (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id TEXT,
            item_name TEXT,
			item_quantity INTEGER DEFAULT 0,
			UNIQUE(member_id, item_name) ON CONFLICT REPLACE,
            FOREIGN KEY(member_id) REFERENCES members(id)
		)
	`);
});

function deployCommands() {
	const filePath = 'bin/deploy-commands.js';
	const nodeProcess = spawn('node', [filePath]);
	nodeProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});
	nodeProcess.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});
	nodeProcess.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const eventsPath = path.join(__dirname, '../events');
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

deployCommands();
client.login(process.env.DISCORD_TOKEN);
