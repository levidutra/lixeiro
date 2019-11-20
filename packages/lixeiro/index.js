const MarkerLocations = require('./config.json').JobsPositions;
const TruckSpawnPoints = require('./config.json').TruckSpawnPoints;

let usedDumpsters = [];

// Setup markers
MarkerLocations.forEach((loc) => {
	let position = new mp.Vector3(loc.x, loc.y, loc.z - 1.0);
	mp.markers.new(1, position, 2.0);
	let colSphere = mp.colshapes.newSphere(loc.x, loc.y, loc.z - 1.0, 2.0);
	colSphere.isGarbageJob = true;
	let marker = mp.labels.new("Trabalhar como lixeiro \n Pressione ~g~E~s~ para trabalhar ou para parar de trabalhar", new mp.Vector3(loc.x, loc.y, loc.z),
	{
		los: true,
		font: 2,
		drawDistance: 20,
	});
	mp.blips.new(318, position,
	{
		name: 'Trabalho de lixeiro'
	});
});

// Default Events
mp.events.add('playerEnterColshape', (player, shape) => {
	if (shape.isGarbageJob) {
		player.setVariable('insideGarbage', true);
	}
});

mp.events.add('playerExitColshape', (player, shape) => {
	if (shape.isGarbageJob) {
		player.setVariable('insideGarbage', false);
	}
});

// Custom Events
mp.events.add('garbage:setUpJob', (player) => {
	player.setVariable('job', 'garbage')
	player.outputChatBox('Você agora é um lixeiro, procure o seu caminhão');
	SpawnTruck(player);
	player.model = mp.joaat('s_m_y_garbage');
});

mp.events.add('garbage:finishJob', (player) => {
	player.setVariable('job', null);
	let truck = player.getVariable('truck');
	if (truck) {
		truck.setVariable('driver', null);
		truck.destroy();
	}
	player.model = mp.joaat('mp_m_freemode_01');
	player.call('garbage:cleanUp');
	player.outputChatBox('Você não é mais um lixeiro!');
});

mp.events.add('garbage:checkDumpster', (player, pos) => {
	if (usedDumpsters.indexOf(pos) !== -1) {
		player.call('garbage:checkDumpster_cb', [false]);
	} else {
		if (player.hasAttachment("garbage")) {
			player.outputChatBox('Você já tem um saco de lixo na mão!');
		} else {
			usedDumpsters.push(pos);
			player.call('garbage:checkDumpster_cb', [true]);
		}
	}
});

// Methods
function SpawnTruck(player) {
	let truckPos = TruckSpawnPoints[0];
	let trashTruck = mp.vehicles.new(mp.joaat('trash'), new mp.Vector3(truckPos.x, truckPos.y, truckPos.z), {
		heading: truckPos.heading
	});
	trashTruck.setVariable('driver', player);
	player.setVariable('truck', trashTruck);
	player.call('garbage:createLocalMarker', [truckPos]);
}

mp.events.addCommand('teleport', (player) => {
	player.position = new mp.Vector3(TruckSpawnPoints[0].x, TruckSpawnPoints[0].y, TruckSpawnPoints[0].z);
    player.health = 100;
});