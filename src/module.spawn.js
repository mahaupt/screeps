var moduleSpawn = {
    run: function(spawn) {
        if (Game.time % 10 != 0) return;
        moduleSpawn.memCleanup();
        
        var counts = _.countBy(Game.creeps, 'memory.role');
        var minerCount = counts.miner || 0;
        var upgraderCount = counts.upgrader || 0;
        var builderCount = counts.builder || 0;
        var haulerCount = counts.hauler || 0;
        
        var sourceCount = spawn.room.find(FIND_SOURCES).length;
        var containerCount = spawn.room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }}).length;
        var linkCount = spawn.room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_LINK;
	        }}).length;
        
        
        if (minerCount < sourceCount)
        {
            let bodySize = baseCreep.getSuitableBodySize('miner', spawn.room.energyAvailable);
            let body = baseCreep.buildBody(spawn.room, 'miner', bodySize);
            spawn.spawnCreep(body, 'Miner'+Game.time, { memory: {role: 'miner', renewSelf: false}});
        } else
        if (haulerCount < containerCount && 
            haulerCount < sourceCount &&
            haulerCount < sourceCount - linkCount+2) 
        {
            let bodySize = baseCreep.getSuitableBodySize('hauler', spawn.room.energyAvailable);
            let body = baseCreep.buildBody(spawn.room, 'hauler', bodySize);
	        spawn.spawnCreep(body, 'Hauler'+Game.time, { memory: {role: 'hauler', renewSelf: false}});
        } else 
        /*if (false) 
        {
            let bodySize = baseCreep.getSuitableBodySize('queen', spawn.room.energyAvailable);
            let body = baseCreep.buildBody(spawn.room, 'queen', bodySize);
            spawn.spawnCreep(body, 'Queen'+Game.time, { memory: {role: 'queen', renewSelf: false}});
        } else */
        if (upgraderCount < 1)
        {
            let bodySize = baseCreep.getSuitableBodySize('upgrader', spawn.room.energyAvailable);
            let body = baseCreep.buildBody(spawn.room, 'upgrader', bodySize);
            spawn.spawnCreep(body, 'Upgrader'+Game.time, { memory: {role: 'upgrader', renewSelf: false}});
        } else 
        if (builderCount < 4)
        {
            let bodySize = baseCreep.getSuitableBodySize('builder', spawn.room.energyAvailable);
            let body = baseCreep.buildBody(spawn.room, 'builder', bodySize);
            spawn.spawnCreep(body, 'Builder'+Game.time, { memory: {role: 'builder', renewSelf: false}});
        } 
        
    },
    
    memCleanup: function() {
        //cleanup
        for (var i in Memory.creeps)
        {
            if (!Game.creeps[i])
            {
                delete Memory.creeps[i];
            }
        }
    } 
};

module.exports = moduleSpawn;
