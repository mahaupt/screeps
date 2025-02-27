module.exports = {
    sleep_timeout: 1000,
    attack_timeout: 1500,
    core_timeout: 90000,
    run: function(ops)
    {
        this.init(ops);
        
        // Attack check
        this.attackTimeout(ops);

        if (ops.mem.timeout > Game.time) return;
        ops.mem.timeout = Game.time + this.sleep_timeout;
        
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
        if (!_.isArray(path) || path.length > 15) {
            console.log("Ops.Harvest: Path too long from " + ops.source + " to " + ops.target + ": Abort!");
            ops.finished = true;
            return;
        }
        
        // EXISTING HARVESTER
        var roomhvstr = _.filter(Memory.creeps, (s) => (s.role == "harvester" || s.role == "miner") && s.troom == ops.target);
        let troom = Game.rooms[ops.target];
        let sroom = Game.rooms[ops.source];
        
        // DEPOSITS AND MINERALS ONLY ON >LVL 6 SOURCE ROOMS
        if (sroom.controller.level >= 6) {
            // PICK Deposits
            if (intel.deposits && intel.deposits_cooldown < 10) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'deposit' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(sroom, "harvester", {troom: ops.target});
                    return;
                }
            }
            // PICK Minerals
            if (intel.minerals && intel.minerals_extr && intel.minerals_amt > 2000) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'mineral' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(sroom, "harvester", {troom: ops.target});
                    return;
                }
            }
        }
        
        
        // Pick Source, max 2 distance
        if (intel.sources >= path.length && path.length <= 2) {
            let h = roomhvstr.length;
            if (h < intel.sources) {
                //spawn miner
                moduleSpawn.addSpawnList(sroom, "miner", {troom: ops.target});
                return;
            }

            // build roads for sources
            if (troom) {
                let containers = troom.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_CONTAINER }});
                if (containers.length > 0) {
                    let center = sroom.storage ? sroom.storage.pos : Autobuilder.getBaseCenterPoint(sroom);
                    for(let c of containers) {
                        if (RoadPlanner.buildRoad(center, c.pos) > 0) {
                            ConstructionManager.recalculateRoom(sroom);
                            return;
                        }
                    }
                }
            }

            // spawn reserver when roads been built
            if (troom.controller && (!troom.controller.reservation || troom.controller.reservation.ticksToEnd <= this.sleep_timeout)) {
                moduleSpawn.addSpawnList(sroom, "reserver", {troom: ops.target});
            }

            // source exists - prevent timeout
            return;
        }
        
        //no harvester exist and nothing to harvest - wait
        // TODO: prevent this from executing
        ops.mem.timeout = Game.time + this.core_timeout;
    }, 
    
    attackTimeout: function(ops)
    {
        let troom = Game.rooms[ops.target];
        if (!troom) return; // visibility check
        if (troom.memory.attacked_time+10 > Game.time) {
            ops.mem.timeout = Game.time + this.attack_timeout;
            var msg = "Ops." + ops.type + "(" + ops.target + "): attack on harvester detected. Pausing...";
            Game.notify(msg);
            return;
        }

        // find invaders
        let hostiles = troom.find(FIND_HOSTILE_CREEPS, {filter: (h) => h.owner.username == "Invader"});
        if (hostiles.length > 0) {
            ops.mem.timeout = Game.time + hostiles[0].ticksToLive;
        }
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.timeout = 0;
    }
};