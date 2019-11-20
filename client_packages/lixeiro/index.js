let localPlayer = mp.players.local;
let marker = null;
let totalColetado = 0;
let totalPay = 0;
let trashInHands = false;

// Configs
let payRatePerBag = 150.0;
let payRatePerDistance = 0.1;
let raycastDistance = 5.0; 
// Dumpsters props player is allowed to collect gabage from
let dumpsters = [
	'prop_dumpster_01a',
	'prop_dumpster_02a',
	'prop_dumpster_02b',
	'prop_dumpster_3a',
	'prop_dumpster_4a'
];

// Methods
function GetLookingObject() {
	const camera = mp.cameras.new("gameplay");
    let position = camera.getCoord();
    let direction = camera.getDirection()
    let farAway = new mp.Vector3((direction.x * raycastDistance) + (position.x), (direction.y * raycastDistance) + (position.y), (direction.z * raycastDistance) + (position.z)); // calculate a random point, drawn on a invisible line between camera position and direction (* distance)
    let object = mp.raycasting.testPointToPoint(position, farAway, [2, 16]);
    return object;
}

function IsLookingToGarbageCan() {
	let object = GetLookingObject();
	let x = false;
    if (object) {
    	let model = mp.game.invoke('0x9F47B058362C84B5', object.entity);
    	
    	dumpsters.forEach((dump) => {
    		if (model == mp.game.joaat(dump)) {
    			x = true;
    		}
    	});
    }
    return x;
}

function IsLookingToTruck() {
	let object = GetLookingObject();
	return (object && object.entity && object.entity.model == mp.game.joaat('trash'))
}

function CalculatePay() {
	let distance = mp.game.pathfind.calculateTravelDistanceBetweenPoints(-317.31, -1539.70, 27.65, localPlayer.position.x, localPlayer.position.y, localPlayer.position.y);
	return (distance * payRatePerDistance + payRatePerBag);
}

function IsInsideTruck() {
	if (localPlayer.vehicle) {
		let truck = localPlayer.getVehicleIsIn(false);
		if (localPlayer.vehicle.model == mp.game.joaat('trash')) {
			return true;
		}
	}
	return false;
}

function PlayerIsGarbageWorker() {
	return (localPlayer.getVariable('job') == 'garbage')
}

// Efficient Attachments
mp.attachmentMngr.register("garbage", "ng_proc_binbag_01a", 57005, new mp.Vector3(0.5, -0.103, 0.06), new mp.Vector3(0.0, -100.0, 0.0));

// Binding E key for interactions
mp.keys.bind(0x45, true, () => {
    if (localPlayer.getVariable('insideGarbage')) {
    	if (localPlayer.getVariable('job') == 'garbage') {
    		mp.events.callRemote('garbage:finishJob');
    	} else {
    		mp.events.callRemote('garbage:setUpJob');
    		totalPay = 0;
    		totalColetado = 0;
    	}
    } else if (PlayerIsGarbageWorker()) {
    	if (IsLookingToGarbageCan() && !trashInHands) {
    		let object = GetLookingObject();
    		let pos = mp.game.invoke('0x3FEF770D40960D5A', object.entity, true);
    		mp.events.callRemote('garbage:checkDumpster', pos);
    	} else if (IsLookingToTruck() && trashInHands) {
    		trashInHands = false;
    		mp.attachmentMngr.removeLocal('garbage');
    		mp.gui.chat.push('Você jogou o lixo no caminhao!');
    		totalPay += CalculatePay();
    		totalColetado += 1;
    	}
    }
});

// Custom events
mp.events.add('garbage:createLocalMarker', (pos) => {
	marker = mp.markers.new(0, new mp.Vector3(pos.x, pos.y, pos.z + 5.0), 3.0);
});

mp.events.add('garbage:checkDumpster_cb', (result) => {
	if (result) {
		trashInHands = true;
		mp.attachmentMngr.addLocal('garbage');
		mp.gui.chat.push('Você coletou lixo com sucesso! Leve-o até o caminhão!');
	} else {
		mp.gui.chat.push('Essa lixeira está vazia!');
	}
});

mp.events.add('garbage:cleanUp', () => {
	if (marker != null) {
		marker.destroy();
		marker = null;
	}
	if (trashInHands) {
		trashInHands = false;
		mp.attachmentMngr.removeLocal('garbage');
	}
	totalColetado = 0;
	totalPay = 0;
});

// Default events
mp.events.add("playerEnterVehicle", (veh, seat) => {
	if (localPlayer.getVariable('truck') == veh && marker != null) {
		mp.gui.chat.push('Procure por lixeiras e aproxime-se delas, quanto mais longe você for, mais ganhará!');
		marker.destroy();
		marker = null;
	}

	if (PlayerIsGarbageWorker() && trashInHands) {
		mp.gui.chat.push('Você não pode entrar em veículos com lixo na mão, perdeu o saco!');
		trashInHands = false;
		mp.attachmentMngr.removeLocal('garbage');
	}
});

// Rendering text
mp.events.add('render', () => {
	if (PlayerIsGarbageWorker()) {
		if (IsLookingToGarbageCan() && !trashInHands) {
			mp.game.graphics.drawText("~g~E~s~ para coletar o lixo", [0.5, 0.9], { 
		      font: 2, 
		      color: [255, 255, 255, 185], 
		      scale: [0.6, 0.6], 
		      outline: true,
		      centre: false
		    });
		} else if (IsLookingToTruck() && trashInHands) {
			mp.game.graphics.drawText("~g~E~s~ para colocar o lixo no caminhao", [0.5, 0.9], { 
		      font: 2, 
		      color: [255, 255, 255, 185], 
		      scale: [0.6, 0.6], 
		      outline: true,
		      centre: false
		    });
		} else if (IsInsideTruck()) {
			mp.game.graphics.drawText(`Lucro RS ~g~${parseInt(totalPay)}~s~ \n Coletado ~g~${totalColetado}~s~`, [0.5, 0.9], { 
		      font: 2, 
		      color: [255, 255, 255, 185], 
		      scale: [0.6, 0.6], 
		      outline: true,
		      centre: false
		    });
		}
	}
});

// TODO: Check if player is fully stopped before any interaciton