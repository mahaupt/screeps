module.exports = {
    cooldown: 500,

    run: function(ops)
    {
        this.init(ops);

        // cooldown
        if (ops.mem.cooldown > Game.time) return;
        ops.mem.cooldown = Game.time + this.cooldown;
        
        // check if scout has completed
        if (Intel.lastUpdate(ops.target)+this.cooldown >= Game.time) 
        {
            // recent intel already exists, abort
            ops.finished = true;
            return;
        }

        let intel = Intel.get(ops.target);
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
        
        //check if scout is still alive
        let scouts = _.filter(Memory.creeps, (s) => s.role == "scout");
        let scout = _.find(scouts, (s) => s.troom == ops.target);
        if (scout) return;
        
        //get room path and look for hostiles
        let path = Game.map.findRoute(ops.source, ops.target);
        if (!_.isArray(path) || path.length >= 20) 
        {
            ops.finished = true;
            console.log("Scout ops " + ops.source + " to " + ops.target + " aborted. No suitable path found.");
            return;
        }
        
        //if not completed, spawn new scout
        if (scouts.length < 2) 
        {
            //spawn new scout
            moduleSpawn.addSpawnList(Game.rooms[ops.source], "scout", {troom: ops.target});
        } 
        else 
        {
            // too many scouts - add to task list
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
        ops.mem.cooldown = 0;
    }, 
};