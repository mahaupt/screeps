var moduleSpawn = {
    run: function(spawn) {
        if (Game.time % 10 != 0) return;
        
        var counts = _.countBy(Game.creeps, 'memory.role');
        var harvesterCount = counts['harvester'] || 0;
        var upgraderCount = counts['upgrader'] || 0;
        var builderCount = counts['builder'] || 0;
        var haulerCount = counts['hauler'] || 0;
        
        var sourceCount = spawn.room.find(FIND_SOURCES).length;
        var containerCount = spawn.room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }}).length;
	        
        
        
        var spawnBody = [WORK, CARRY, MOVE];
        var bodyIterations = Math.floor(spawn.room.energyAvailable/400)-1;
        bodyIterations = Math.min(bodyIterations, 1);
        
        
        if (harvesterCount < sourceCount)
        {
	        for (var i=0; i < bodyIterations; i++)
	        {
		        if (i%2==0) {
		        	spawnBody.push(WORK, WORK);
		        } else {
			        spawnBody.push(WORK, CARRY, MOVE);
		        }
	        }
	        spawnBody.sort();
            spawn.spawnCreep(spawnBody, 'Harvester'+Game.time, { memory: {role: 'harvester', renewSelf: false}});
        } else
        if (haulerCount < containerCount && haulerCount < sourceCount) 
        {
	        spawnBody = [CARRY, CARRY, MOVE];
	        for (var i=0; i < bodyIterations; i++)
	        {
			    spawnBody.push(CARRY, CARRY, MOVE, MOVE);
	        }
	        spawnBody.sort();
	        spawn.spawnCreep(spawnBody, 'Hauler'+Game.time, { memory: {role: 'hauler', renewSelf: false}});
        } else 
        if (upgraderCount < 1)
        {
	        for (var i=0; i < bodyIterations; i++)
	        {
			    spawnBody.push(WORK, CARRY, MOVE);
	        }
	        spawnBody.sort();
            spawn.spawnCreep(spawnBody, 'Upgrader'+Game.time, { memory: {role: 'upgrader', renewSelf: false}});
        } else 
        if (builderCount < 4)
        {
	        for (var i=0; i < bodyIterations; i++)
	        {
			    spawnBody.push(WORK, CARRY, MOVE);
	        }
	        spawnBody.sort();
            spawn.spawnCreep(spawnBody, 'Builder'+Game.time, { memory: {role: 'builder', renewSelf: false}});
        } 
        
        
        
        //cleanup
        for (var i in Memory.creeps)
        {
            if (!Game.creeps[i])
            {
                delete Memory.creeps[i];
            }
        }
    }
}

module.exports = moduleSpawn;
