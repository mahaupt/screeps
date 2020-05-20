var moduleDefense = {
	run: function(room)
	{
		
		var towers = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER }
		});
		
		for(var tower of towers)
		{
			//shoot hostiles
			var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	        if(closestHostile) {
	            tower.attack(closestHostile);
				continue;
	        }
			
			//heal creeps
			var injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (s) => (s.hits < s.hitsMax) });
			if (injured) {
				tower.heal(injured);
				continue;
			}
			
			//repair stuff if no hostiles
			var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
	            filter: (structure) => structure.hits < structure.hitsMax
	        });
	        if(closestDamagedStructure) {
	            tower.repair(closestDamagedStructure);
	        }
		}
		
		
		//auto safemode
		var hostiles = room.find(FIND_HOSTILE_CREEPS);
		if (hostiles.length > 0)
		{
			//check if hostiles are near creeps or structures
			for (var i=0; i < hostiles.length; i++)
			{
				var ncreeps = hostiles[i].pos.findInRange(FIND_MY_CREEPS, 4).length;
				var nconstr = hostiles[i].pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 4).length;
				var nstruct = hostiles[i].pos.findInRange(FIND_STRUCTURES, 4).length;
				
				//console.log("Danger-level: " + (ncreeps+nconstr+nstruct));
				if (ncreeps+nconstr+nstruct > 0)
				{
					//try activate safe mode
					//console.log("danger!");
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
					
					break;
				}
			}
		}
	}
}


module.exports = moduleDefense;