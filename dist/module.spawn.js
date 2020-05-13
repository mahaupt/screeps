var moduleSpawn = {
    run: function(spawn) {
        if (Game.time % 10 != 0) return;
        
        var sourceCount = spawn.room.find(FIND_SOURCES).length;
        var counts = _.countBy(Game.creeps, 'memory.role');
        var harvesterCount = counts['harvester'] || 0;
        var upgraderCount = counts['upgrader'] || 0;
        var builderCount = counts['builder'] || 0;
        
        var spawnBody = [WORK, CARRY, MOVE];
        var bodyIterations = Math.floor(spawn.room.energyAvailable/200.0)-1;
        for (var i=0; i < bodyIterations; i++)
        {
	        spawnBody.push(WORK, CARRY, MOVE);
        }
        
        if (harvesterCount < sourceCount)
        {
            spawn.spawnCreep(spawnBody, 'Harvester'+Game.time, { memory: {role: 'harvester', renewSelf: false}});
        } else
        if (upgraderCount < 1)
        {
            spawn.spawnCreep(spawnBody, 'Upgrader'+Game.time, { memory: {role: 'upgrader', renewSelf: false}});
        } else 
        if (builderCount < 4)
        {
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
