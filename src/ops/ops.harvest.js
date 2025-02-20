module.exports = {
    sleep_timeout: 1000,
    attack_timeout: 30000,
    core_timeout: 90000,
    run: function(ops)
    {
        this.init(ops);
        
        if (ops.mem.timeout + this.sleep_timeout > Game.time) return;
        ops.mem.timeout = Game.time;
        
        //Attack pause
        this.attackTimeout(ops);
        
        // OWN ROOM - SKIP
        if (Game.rooms[ops.target] && Game.rooms[ops.target].controller && Game.rooms[ops.target].my) {
            console.log("Ops.Harvest: Own room. Aborting");
            ops.finished = true;
            return;
        }
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
        
        //skip spawning harvesters on low energy levels
        var elevel = Memory.rooms[ops.source].stats.energy / Memory.rooms[ops.source].stats.capacity;
        if (elevel < 0.05) return;
        
        
        // GET INTEL
        if (!Memory.intel || !Memory.intel.list || !Memory.intel.list[ops.target]) 
        {
            Ops.new("scout", ops.source, ops.target);
            return;
        }
        var intel = Memory.intel.list[ops.target];
        
        // AVOID DANGERS
        if (intel.threat == "player" || intel.threat == "keeper") {
            console.log("Ops.Harvest: Player or Keepers in Room. Aborting");
            ops.finished = true;
            return;
        } else 
        if (intel.threat == "core") {
            //core in room - wait until gone
            ops.mem.timeout = Game.time + this.core_timeout;
            return;
        }
        
        // PATH DISTANCE
        var path = Game.map.findRoute(ops.source, ops.target);
        if (!_.isArray(ret) || path.length > 15) {
            console.log("Ops.Harvest: Path too long from " + ops.source + " to " + ops.target + ": Abort!");
            ops.finished = true;
            return;
        }
        
        // EXISTING HARVESTER
        var roomhvstr = _.filter(Memory.creeps, (s) => s.role == "harvester" && s.troom == ops.target);
        
        // DEPOSITS AND MINERALS ONLY ON >LVL 6 SOURCE ROOMS
        if (Game.rooms[ops.source].controller.level >= 6) {
            // PICK Deposits
            if (intel.deposits && intel.deposits_cooldown < 10) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'deposit' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(Game.rooms[ops.source], "harvester", {troom: ops.target});
                    return;
                }
            }
            // PICK Minerals
            if (intel.minerals && intel.minerals_extr && intel.minerals_amt > 2000) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'mineral' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(Game.rooms[ops.source], "harvester", {troom: ops.target});
                    return;
                }
            }
        }
        
        
        // Pick Source
        if (intel.sources > 0 && path.length <= 1) {
            let h = _.findIndex(roomhvstr, (s) => s.source_type == 'source' );
            if (h < 0) {
                //spawn harvester
                moduleSpawn.addSpawnList(Game.rooms[ops.source], "harvester", {troom: ops.target});
                return;
            }
        }
        
        //no harvester exist and nothing to harvest - wait
        ops.mem.timeout = Game.time + this.core_timeout;
    }, 
    
    attackTimeout: function(ops)
    {
        var roomhvstr = _.filter(Memory.creeps, (s) => s.role == "harvester" && s.troom == ops.target && s.attacked_time+this.sleep_timeout > Game.time);
        if (roomhvstr.length > 0) {
            ops.mem.timeout = Game.time + this.attack_timeout;
            var msg = "Ops." + ops.type + "(" + ops.target + "): attack on harvester detected. Pausing...";
            Game.notify(msg);
            return true;
        }
        return false;
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.timeout = 0;
    }
};