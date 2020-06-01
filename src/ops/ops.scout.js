module.exports = {
    run: function(ops)
    {
        this.init(ops);
        
        //check if scout has completed
        var intel = Memory.intel.list[ops.target];
        if (Memory.intel.list[ops.target]) 
        {    
            if (intel.time > Game.time - 200) {
                ops.finished = true;
                return;
            }
        }
        
        //spawn cooldown
        if (ops.mem.cooldown > Game.time) return;
        ops.mem.cooldown = Game.time + 500;
        
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
        
        
        //check if scout is still on its way
        var scout = _.find(Memory.creeps, (s) => s.role == "scout" && s.troom == ops.target);
        if (scout) return;
        
        
        //skip if room is my own
        if (Game.rooms[ops.target] && 
            Game.rooms[ops.target].controller && 
            Game.rooms[ops.target].controller.my)
        {
            ops.finished = true;
            return;
        }
        
        
        //get room path and look for hostiles
        var path = Game.map.findRoute(ops.source, ops.target, {routeCallback: baseCreep.roomCostCallback});
        if (path == ERR_NO_PATH || path.length >= 20) 
        {
            ops.finished = true;
            console.log("Scout ops " + ops.source + " to " + ops.target + " aborted. No suitable path found.");
            return;
        }
        
        
        //if not completed, spawn new creep
        var scouts = _.sum(Memory.creeps, (s) => s.role == "scout");
        if (scouts < 2) 
        {
            //spawn new scout
            moduleSpawn.addSpawnList(Game.rooms[ops.source], "scout", {troom: ops.target});
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