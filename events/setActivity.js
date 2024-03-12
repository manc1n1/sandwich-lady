const { Events, ActivityType } = require('discord.js');

let currentIndex = 0;
const states = [
	{
		type: ActivityType.Custom,
		name: '0',
		state: '🥪 You look hungry to me.',
	},
	{
		type: ActivityType.Custom,
		name: '1',
		state: '🥪 I tell you what -',
	},
	{
		type: ActivityType.Custom,
		name: '2',
		state: '🥪 have a Discord Role on me.',
	},
	{
		type: ActivityType.Custom,
		name: '3',
		state: '🥪 /getrole',
	},
];

module.exports = {
	name: Events.ClientReady,
	execute(client) {
		function setActivitySequentially() {
			const state = states[currentIndex];
			client.user.setActivity(state);
			currentIndex = (currentIndex + 1) % states.length;
			setTimeout(setActivitySequentially, 5000);
		}
		setActivitySequentially();
	},
};
