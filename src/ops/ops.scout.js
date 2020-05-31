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
        
        
        //get room path and look for hostiles
        var path = Game.map.findRoute(ops.source, ops.target);
        for (let i in path) {
            if (Memory.intel && Memory.intel.list && Memory.intel.list[path[i].room]) {
                if (Memory.intel.list[path[i].room].threat == "core" || 
                Memory.intel.list[path[i].room].threat == "player")
                {
                    // enemy or core blocks path
                    ops.finished = true;
                    console.log("Scout ops " + ops.source + " to " + ops.target + " aborted. Enemy in path.");
                    return;
                }
            }
        }
        
        
        //if not completed, spawn new creep
        var scouts = _.sum(Memory.creeps, (s) => s.role == "scout");
        if (scouts < 2) 
        {
            //spawn new scout
            moduleSpawn.addSpawnList(Game.rooms[ops.source], "scout", {target: ops.target});
        } 
        else 
        {
            //add to task list
            var index = Memory.intel.req.indexOf(ops.target);
            if (index < 0) {
                Memory.intel.req.push(ops.target);
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