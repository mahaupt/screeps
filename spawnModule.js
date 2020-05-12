var spawnModule = {
    run: function() {
        if (Game.time % 10 != 0) return;
        
        var counts = _.countBy(Game.creeps, 'memory.role');
        var harvesterCount = counts['harvester'] || 0;
        var upgraderCount = counts['upgrader'] || 0;
        var builderCount = counts['builder'] || 0; 
        
        if (harvesterCount < 2)
        {
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Harvester'+Game.time, { memory: {role: 'harvester'}});
        }
        if (upgraderCount < 1)
        {
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Upgrader'+Game.time, { memory: {role: 'upgrader'}});
        }
        if (builderCount < 4)
        {
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Builder'+Game.time, { memory: {role: 'builder'}});
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

module.exports = spawnModule;
