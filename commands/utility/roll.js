const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/data.db');

const dropTable = [
	{ item: 'Chocolate bar', chance: 7 },
	{ item: 'Kebab', chance: 7 },
	{ item: 'Meat pie', chance: 7 },
	{ item: 'Roll', chance: 7 },
	{ item: 'Square sandwich', chance: 7 },
	{ item: 'Triangle sandwich', chance: 7 },
	{ item: 'Baguette', chance: 7 },
];

const baguetteTable = [{ item: 'Stale baguette', chance: 64 }];

function getRandomNumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollItem() {
	let totalChance = 0;
	for (const drop of dropTable) {
		totalChance += drop.chance;
	}
	const randomNumber = getRandomNumber(0, totalChance);
	let cumulativeChance = 0;
	for (const drop of dropTable) {
		cumulativeChance += drop.chance;
		if (randomNumber <= cumulativeChance) {
			if (drop.item === 'Baguette') {
				const staleBaguetteRoll = getRandomNumber(
					1,
					baguetteTable[0].chance,
				);
				if (staleBaguetteRoll === 1) {
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
		await interaction.deferReply();
		try {
			const guild = interaction.guild;
			const memberID = interaction.user.id;
			const member = guild.members.cache.get(memberID);
			const itemName = rollItem();
			await updateInventory(memberID, itemName);
			await getItemQuantity(memberID, itemName);
			const allItemsAndQuantities = await getAllItemsAndQuantities(
				memberID,
			);
			let message = `${member} received 1x **${itemName}**\n\n__Inventory:__\n`;
			allItemsAndQuantities.forEach(({ item_name, item_quantity }) => {
				message += `**${item_name}**: ***${item_quantity}***\n`;
			});
			await interaction.followUp(message);
		} catch (err) {
			console.error(`Error: ${err.message}`);
			await interaction.followUp(`*Error: ${err.message}*`);
			return;
		}
	},
};

function updateInventory(memberID, itemName) {
	return new Promise((resolve, reject) => {
		// Check if the row exists
		db.get(
			'SELECT * FROM inventory WHERE member_id = ? AND item_name = ?',
			[memberID, itemName],
			(err, row) => {
				if (err) {
					console.error('Error checking inventory:', err.message);
					reject(err);
					return;
				}
				if (row) {
					// If the row exists, update item_quantity
					db.run(
						'UPDATE inventory SET item_quantity = item_quantity + 1 WHERE member_id = ? AND item_name = ?',
						[memberID, itemName],
						(err) => {
							if (err) {
								console.error(
									'Error updating inventory:',
									err.message,
								);
								reject(err);
							} else {
								console.log('Inventory updated successfully.');
								resolve();
							}
						},
					);
				} else {
					// If the row does not exist, insert a new row
					db.run(
						'INSERT INTO inventory (member_id, item_name, item_quantity) VALUES (?, ?, 1)',
						[memberID, itemName],
						(err) => {
							if (err) {
								console.error(
									'Error inserting into inventory:',
									err.message,
								);
								reject(err);
							} else {
								console.log('New item added to inventory.');
								resolve();
							}
						},
					);
				}
			},
		);
	});
}

function getItemQuantity(memberID, itemName) {
	return new Promise((resolve, reject) => {
		db.get(
			'SELECT item_quantity FROM inventory WHERE member_id = ? AND item_name = ?',
			[memberID, itemName],
			(err, row) => {
				if (err) {
					reject(err);
				} else {
					if (row) {
						resolve(row.item_quantity);
					}
					resolve(0);
				}
			},
		);
	});
}

async function getAllItemsAndQuantities(memberID) {
	return new Promise((resolve, reject) => {
		db.all(
			'SELECT item_name, item_quantity FROM inventory WHERE member_id = ?',
			[memberID],
			(err, rows) => {
				if (err) {
					console.error(
						'Error fetching items and quantities:',
						err.message,
					);
					reject(err);
				} else {
					resolve(rows);
				}
			},
		);
	});
}
