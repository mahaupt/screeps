var moduleStrategy = {
    pioneerCount: 5,
    
    run: function(room)
    {
        if (!Memory.intel) {
            Memory.intel = {};
        }
        if (!Memory.req_intel) {
            Memory.req_intel = [];
        }
        
        //basic scan
        if (_.size(Memory.intel) < 3) {
            var exits = Game.map.describeExits(room.name);
            for (var i in exits) {
                moduleStrategy.requestIntel(exits[i]);
            }
        }
        
        //spawn scouts
        if (Memory.req_intel.length > 0 && room.controller.level >= 3) 
        {
            if (!Memory.intel_sc_cdown || Memory.intel_sc_cdown < Game.time) {
                //make sure there is a scout
                var scout = _.find(Memory.creeps, (s)=>s.role == 'scout');
                if (!scout) {
                    moduleStrategy.spawnScout(room);
                    Memory.intel_sc_cdown = Game.time + 50;
                }
            }
        }
        
        
        //capturing
        if (room.memory.strat_capture) {
            moduleStrategy.captureRoom(room);
        }
    },
    
    requestIntel: function(target) {
        if (!Memory.req_intel) {
            Memory.req_intel = [];
        }
        
        var index = Memory.req_intel.indexOf(target);
        if (index < 0) {
            Memory.req_intel.push(target);
        }
    }, 
    
    spawnScout: function(room)
    {
        var spawn = room.find(FIND_STRUCTURES, {filter: (s) => 
            s.structureType == STRUCTURE_SPAWN});
        if (spawn.length <= 0) return;
        
        moduleSpawn.addSpawnList(spawn[0], "scout");
    },
    
    startCapturingRoom: function(room, target)
    {
        room.memory.strat_capture = true;
        room.memory.strat_capture_tgt = target;
        
        //create pioneer group
        var spawn = room.find(FIND_STRUCTURES, {filter: (s) => 
            s.structureType == STRUCTURE_SPAWN});
        if (spawn.length > 0)
        {
            moduleStrategy.createPioneerGroup(spawn[0]);
        }
    },
    
    captureRoom: function(room)
    {
        var pioneers = room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role == 'pioneer'});
        
        if (pioneers.length >= moduleStrategy.pioneerCount) 
        {
            //pioneers have spawned - spawn claimer and go
            var spawn = room.find(FIND_STRUCTURES, {filter: (s) => 
                s.structureType == STRUCTURE_SPAWN});
            if (spawn.length <= 0) return;
            
            var ret = moduleSpawn.spawn(
                spawn[0],  
                "claimer", 
                {target: room.memory.strat_capture_tgt}
            );
            
            if (ret) 
            {
                console.log("Claimer created... sending pioneers");
                //claimer spawn successful, set targets
                for (var index in pioneers) {
                    pioneers[index].memory.target = room.memory.strat_capture_tgt;
                }
                
                //cleanup
                delete room.memory.strat_capture;
                delete room.memory.strat_capture_tgt;
            }
        } 
    }, 
    
    createPioneerGroup: function(spawn)
    {
        console.log("creating pioneer spawn...");
        for (var i=0; i < moduleStrategy.pioneerCount; i++) {
            moduleSpawn.addSpawnList(spawn, "pioneer");
        }
    }, 
    
    
    roomNameToCoords: function(name)
    {
        //W1S12
        if (name == "sim") return {x: 0, y: 0};
        
        var lat = null;
        var latsig = -1;
        var latindex = name.search("S");
        if (latindex >= 0) {
            lat = "S";
        } else {
            lat = "N";
            latindex = name.search("N");
            latsig = +1;
        }
        
        var lon = name.substr(0, 1);
        var lonnum = parseInt(name.substr(1, latindex-1));
        var latnum = parseInt(name.substr(latindex+1));
        
        var lonsig = -1;
        if (lon == "E") {
            lonsig = 1;
        }
        
        var cords = {};
        cords.x = lonnum*lonsig+lonsig;
        cords.y = latnum*latsig+latsig;
        
        return cords;
    },
    
    
    roomCordsToName: function(coords)
    {
        var lat = "N";
        var lon = "E";
        
        if (coords.x < 0) {
            lon = "W";
        }
        if (coords.y < 0) {
            lat = "S";
        }
        
        var lonnum = Math.abs(coords.x)-1;
        var latnum = Math.abs(coords.y)-1;
        
        return lon + lonnum + lat + latnum;
    }
    
    
};

module.exports = moduleStrategy;