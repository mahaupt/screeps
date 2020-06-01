module.exports = {
	run: function(room)
	{
		
		var towers = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER }
		});
		
		// TOWERS SHOOTING TARGET
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
			
			//repair stuff if no hostiles and enough energy
			if (tower.store[RESOURCE_ENERGY] > tower.store.getCapacity(RESOURCE_ENERGY)/2) {
				
				//repair structures except walls below 10k hps
				var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
		            filter: (structure) => structure.hits < structure.hitsMax && (
					structure.structureType != STRUCTURE_WALL && 
					structure.structureType != STRUCTURE_RAMPART || 
					structure.hits < 10000)
		        });
		        if(closestDamagedStructure) {
		            tower.repair(closestDamagedStructure);
					continue;
		        }
				
				//maybe repair walls
				
			}
		}
		
		
		//AUTO SAFEMODE
		var hostiles = room.find(FIND_HOSTILE_CREEPS);
		if (hostiles.length > 0)
		{
			room.memory.attacked_time = Game.time;
			
			//check if hostiles are near creeps or structures
			for (var i=0; i < hostiles.length; i++)
			{
				var ncreeps = hostiles[i].pos.findInRange(FIND_MY_CREEPS, 4).length;
				var nconstr = hostiles[i].pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 4).length;
				var nstruct = hostiles[i].pos.findInRange(FIND_STRUCTURES, 4).length;
				
				//activate safe mode if more then 3 hostiles or no towers
				if (ncreeps+nconstr+nstruct > 0 && 
					(hostiles.length > 3 || towers.length == 0))
				{
					//try activate safe mode
					//console.log("danger!");
					if (!room.controller.safeMode) {
						if (room.controller.activateSafeMode() == OK)
						{
							let msg = room.name + ": Hostiles detected! Safe mode activated!";
							Game.notify(msg);
							console.log(msg);
						} else {
							let msg = room.name + ": Hostiles detected! Safe mode failed!";
							Game.notify(msg);
							console.log(msg);
						}
					}
					
					break;
				}
			}
		} 
		
		
		
		// SPAWN ROOM LIFETIME OPS
		if (Game.time % 100 == 0) {
			var index = _.findIndex(
				Memory.ops, (s) => 
				{ return s.type == "room_lifetime" && s.source == room.name; }
			);
			if (index < 0) {
				Ops.new("room_lifetime", room.name, "");
			}
		}
		
		
	}
};