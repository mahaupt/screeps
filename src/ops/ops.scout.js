module.exports = {
    run: function(ops)
    {
        this.init(ops);
        
        //check if scout has completed
        var intel = Memory.intel.list[ops.target];
        if (Memory.intel.list[ops.target]) 
        {    
            if (intel.time > Game.time -100) {
                ops.finished = true;
                return;
            }
        }
        
        //spawn cooldown
        if (ops.mem.cooldown > Game.time) return;
        ops.mem.cooldown = Game.time + 500;
        
        //if not completed, spawn new creep
        var scouts = _.sum(Memory.creeps, (s) => s.role == "scout");
        if (scouts < 2) 
        {
            //spawn new scout
            var spawns = Game.rooms[ops.source].find(
                FIND_STRUCTURES, 
                {filter: (s) => s.structureType == STRUCTURE_SPAWN}
            );
            if (spawns.length > 0) {
                moduleSpawn.addSpawnList(spawns[0], "scout", {target: ops.target});
            }
        } 
        else 
        {
            //add to task list
            var index = Memory.intel.req.indexOf(target);
            if (index < 0) {
                Memory.intel.req.push(target);
            }
        }
    },
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        
        //Memory Setup
        if (!Memory.intel) {
            Memory.intel = {};
        }
        if (!Memory.intel.list) {
            Memory.intel.list = {};
        }
        if (!Memory.intel.req) {
            Memory.intel.req = [];
        }
        ops.mem.cooldown = 0;
        
    }, 
};