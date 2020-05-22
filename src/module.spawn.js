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
            moduleSpawn.spawn(spawn, "miner");
        } else
        if (haulerCount < containerCount && 
            haulerCount < sourceCount &&
            haulerCount < sourceCount - linkCount+2) 
        {
            moduleSpawn.spawn(spawn, "hauler");
        } else 
        if (upgraderCount < 1)
        {
            moduleSpawn.spawn(spawn, "upgrader");
        } else 
        if (builderCount < sourceCount)
        {
            moduleSpawn.spawn(spawn, "builder");
        } else  
        
        if (spawn.memory.spawnList)
        {
            if (spawn.memory.spawnList.length > 0)
            {
                var ret = moduleSpawn.spawn(
                    spawn, 
                    spawn.memory.spawnList[0].role, 
                    spawn.memory.spawnList[0].mem || {});
                if (ret) {
                    spawn.memory.spawnList.shift();
                }
            }
        }
    },
    
    spawn: function(spawn, role, memory={})
    {
        let data = { memory: {...{role: role}, ...memory}};
        
        let bodySize = baseCreep.getSuitableBodySize(role, spawn.room.energyAvailable);
        let body = baseCreep.buildBody(spawn.room, role, bodySize);
        let name = baseCreep.getName(spawn.room, role);
        var ret = spawn.spawnCreep(body, name, data);
        
        //console.log(body);
        //console.log(ret);
        
        if (ret == OK)
        {
            return true;
        } else {
            return false;
        }
    },
    
    addSpawnList: function(spawn, role, memory={})
    {
        if (!spawn.memory.spawnList) {
            spawn.memory.spawnList = [];
        }
        
        var s = {role: role, mem: memory};
        spawn.memory.spawnList.push(s);
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
