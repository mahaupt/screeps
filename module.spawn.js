var moduleSpawn = {
    run: function(spawn) {
        if (Game.time % 10 != 0) return;
        
        var counts = _.countBy(Game.creeps, 'memory.role');
        var harvesterCount = counts['harvester'] || 0;
        var upgraderCount = counts['upgrader'] || 0;
        var builderCount = counts['builder'] || 0;
        
        var spawnBody = [WORK, CARRY, MOVE];
        if (spawn.room.energyAvailable >= 400)
        {
	        spawnBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        
        if (harvesterCount < 4)
        {
            spawn.spawnCreep(spawnBody, 'Harvester'+Game.time, { memory: {role: 'harvester', renewSelf: false}});
        }
        if (upgraderCount < 1)
        {
            spawn.spawnCreep(spawnBody, 'Upgrader'+Game.time, { memory: {role: 'upgrader', renewSelf: false}});
        }
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
