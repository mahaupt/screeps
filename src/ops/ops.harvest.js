module.exports = {
    sleep_timeout: 500,
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
        if (Game.rooms[ops.target] && Game.rooms[ops.target].my) {
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
        let intel = Intel.get(ops.target);
        if (!intel) 
        {
            Ops.new("scout", ops.source, ops.target);
            return;
        }

        let troom = Game.rooms[ops.target];
        let sroom = Game.rooms[ops.source];
        
        // AVOID DANGERS
        if (intel[Intel.OWNER] || intel[Intel.KEEPERS]) {
            console.log("Ops.Harvest: Player or Keepers in Room. Aborting");
            ops.finished = true;
            return;
        } 
        if (intel[Intel.INVADER_CORE_LVL] >= 0) {
            // core in room - attack when lvl 0
            ops.mem.timeout = Game.time + this.attack_timeout + 200;
            
            if (intel[Intel.INVADER_CORE_LVL] == 0) {
                moduleSpawn.addSpawnList(sroom, "soldier", {troom: ops.target});
                Game.notify("Ops.Harvest: Invader core in room " + ops.target);
            } else {
                ops.mem.timeout = Game.time + this.core_timeout;
                // multi level - wait longer
            }
            this.sendCreepsHome(ops);
            return;
        }

        if (intel[Intel.RESERVATION_OWNER] === "Invader") {
            // invader reserved, wait until reservation gone
            let timeout = intel[Intel.TIME] + intel[Intel.RESERVATION_TICKS];
            if (timeout >= Game.time) {
                ops.mem.timeout = timeout+5;
                return;
            } else {
                Ops.new("scout", ops.source, ops.target); // check if target clear
                return;
            }
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
        
        // DEPOSITS AND MINERALS ONLY ON >LVL 6 SOURCE ROOMS
        if (sroom.controller.level >= 6) {
            // PICK Deposits
            if (intel[Intel.DEPOSIT] && intel[Intel.DEPOSIT_COOLDOWN] < 10) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'deposit' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(sroom, "harvester", {troom: ops.target});
                    return;
                }
            }
            // PICK Minerals - Extractor only avbl on claimed rooms
            /*if (intel.minerals && intel.minerals_extr && intel.minerals_amt > 2000) {
                let h = _.findIndex(roomhvstr, (s) => s.source_type == 'mineral' );
                if (h < 0) {
                    //spawn harvester
                    moduleSpawn.addSpawnList(sroom, "harvester", {troom: ops.target});
                    return;
                }
            }*/
        }
        
        
        // Pick Source, max 2 distance
        if (intel[Intel.SOURCES] >= path.length && path.length <= 2) {
            let h = roomhvstr.length;
            if (h < intel[Intel.SOURCES]) {
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

        // find invaders
        let invaders = troom.find(FIND_HOSTILE_CREEPS, {filter: (h) => h.owner.username == "Invader"});
        if (invaders.length > 0) {
            ops.mem.timeout = Game.time + invaders[0].ticksToLive;
            troom.memory.attacked_time = Game.time + invaders[0].ticksToLive;
            this.sendCreepsHome(ops);
            return;
        }

        // no invaders but general attacking check
        if (troom.memory.attacked_time+10 >= Game.time && Game.time % 5 == 0) {
            let hostiles = troom.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                ops.mem.timeout = Game.time + this.attack_timeout;
                this.sendCreepsHome(ops);
                return;
            }
        }
    }, 

    sendCreepsHome(ops) {
        // miners
        let miners = _.filter(Memory.creeps, (s) => (s.role == "harvester" || s.role == "miner") && s.troom == ops.target);
        for(let m of miners) {
            m.killSelf = true;
            m.renewSelf = true;
        }
    },
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.timeout = 0;
    }
};