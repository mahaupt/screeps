var moduleSpawn = {
    run: function(spawn) {
        if (Game.time % 10 != 0) return;
        moduleSpawn.memCleanup();
        
        var roomCreeps = spawn.room.find(FIND_MY_CREEPS);
        var counts = _.countBy(roomCreeps, 'memory.role');
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
            moduleSpawn.spawn("Miner", "miner", spawn);
        } else
        if (haulerCount < containerCount && 
            haulerCount < sourceCount &&
            haulerCount < sourceCount - linkCount+2) 
        {
            moduleSpawn.spawn("Hauler", "hauler", spawn);
        } else 
        if (upgraderCount < 1)
        {
            moduleSpawn.spawn("Upgrader", "upgrader", spawn);
        } else 
        if (builderCount < sourceCount)
        {
            moduleSpawn.spawn("Builder", "builder", spawn);
        } else  
        
        if (spawn.memory.spawnList)
        {
            if (spawn.memory.spawnList.length > 0)
            {
                var ret = moduleSpawn.spawn(spawn.memory.spawnList[0].name, spawn.memory.spawnList[0].role, spawn);
                if (ret == OK) {
                    spawn.memory.spawnList.shift();
                }
            }
        }
    },
    
    spawn: function(name, role, spawn)
    {
        let bodySize = baseCreep.getSuitableBodySize(role, spawn.room.energyAvailable);
        let body = baseCreep.buildBody(spawn.room, role, bodySize);
        var ret = spawn.spawnCreep(body, name+Game.time, { 
            memory: {
                role: role
            }
        });
        
        if (ret == OK)
        {
            return true;
        } else {
            return false;
        }
    },
    
    addSpawnList: function(spawn, name, role)
    {
        
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
