var moduleDefense = {
	run: function(room)
	{
		
		var towers = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER }
		});
		
		for(var tower of towers)
		{
			var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
	            filter: (structure) => structure.hits < structure.hitsMax
	        });
	        if(closestDamagedStructure) {
	            tower.repair(closestDamagedStructure);
	        }
	
	        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	        if(closestHostile) {
	            tower.attack(closestHostile);
	        }
		}
		
		
		//auto safemode
		var hostiles = room.find(FIND_HOSTILE_CREEPS);
		if (hostiles.length > 0)
		{
			if (!room.controller.safeMode) {
				if (room.controller.activateSafeMode() == OK)
				{
					Game.notify("Hostiles detected! Safe mode activated!");
					console.log("Hostiles detected! Safe mode activated!");
				} else {
					Game.notify("Hostiles detected! Safe mode failed!");
					console.log("Hostiles detected! Safe mode failed!");
				}
			}
			
			
		}
	}
}


module.exports = moduleDefense;