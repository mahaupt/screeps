module.exports =  {
    run: function(room) {
        this.getTotalEnergyLevel(room);
        this.getTransportStats(room);
    },
    
    
    getTotalEnergyLevel: function(room) {
        if (!room.memory.stats) {
            room.memory.stats = {};
        }
        
        
        var capacity = room.energyCapacityAvailable;
        var energy = room.energyAvailable;
        
        var storages = room.find(FIND_STRUCTURES, {
            filter: (s) => { 
                return s.structureType == STRUCTURE_STORAGE ||
                    s.structureType == STRUCTURE_CONTAINER ||
                    s.structureType == STRUCTURE_TOWER; }});
                    
        for(var s of storages)
        {
            capacity += s.store.getCapacity(RESOURCE_ENERGY);
            energy += s.store[RESOURCE_ENERGY];
        }
        
        room.memory.stats.energy = energy;
        room.memory.stats.capacity = capacity;
        
        var elevel = energy/capacity;
        
        //stats and time dependent collecting
        if (Game.time % 1000 == 9) {
            if (!room.memory.stats.energy_1k) {
                room.memory.stats.energy_1k = energy;
                room.memory.stats.builders_needed = 6; // more builders in beginning
            }
            
            room.memory.stats.energy_1k_dx = room.memory.stats.energy - room.memory.stats.energy_1k;
            room.memory.stats.energy_1k = energy;
            
            //average of 30 times
            room.memory.stats.energy_1k_dx30 = 
                room.memory.stats.energy_1k_dx30*29 + 
                room.memory.stats.energy_1k_dx;
            room.memory.stats.energy_1k_dx30 = Math.round(room.memory.stats.energy_1k_dx30/30);
            
            //add builders
            if (room.memory.stats.energy_1k_dx > 1000 && elevel >= 0.15 || 
                elevel >= 0.95) {
                room.memory.stats.builders_needed += 1;
                if (room.memory.stats.builders_needed > moduleSpawn.max_builders) {
                    room.memory.stats.builders_needed = moduleSpawn.max_builders;
                } else {
                    console.log(room.name + ": incr number of builders");
                }
            }
            
            //remove builders
            if (room.memory.stats.energy_1k_dx < 0 && elevel <= 0.15 ||
                elevel <= 0.05)
            {
                room.memory.stats.builders_needed -= 1;
                if (room.memory.stats.builders_needed < 1) {
                    room.memory.stats.builders_needed = 1;
                } else {
                    //remove one builder
                    console.log(room.name + ": decr number of builders");
                    var creeps = room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role == "builder" });
                    if (creeps.length > 0) {
                        creeps[0].memory.killSelf = true;
                        creeps[0].memory.renewSelf = true;
                    }
                }
            } 
        }
        if (Game.time % 10000 == 9) {
            if (!room.memory.stats.energy_10k) {
                room.memory.stats.energy_10k = energy;
            }
            
            room.memory.stats.energy_10k_dx = room.memory.stats.energy - room.memory.stats.energy_10k;
            room.memory.stats.energy_10k = energy;
            
            //average of 30 times
            room.memory.stats.energy_10k_dx30 = 
                room.memory.stats.energy_10k_dx30*29 + 
                room.memory.stats.energy_10k_dx;
            room.memory.stats.energy_10k_dx30 = Math.round(room.memory.stats.energy_10k_dx30/30);
        }
    }, 
    
    getTransportStats: function(room)
    {
        var volume = 0;
        for (var i in room.memory.ltasks) {
            volume += room.memory.ltasks[i].vol;
        }
        
        room.memory.stats.transports = volume;
        
        if (Game.time % 1000 == 10) {
            if (!room.memory.stats.transports_1k_30) {
                room.memory.stats.transports_1k = volume;
                room.memory.stats.transports_1k_30 = volume;
                room.memory.stats.haulers_needed = 3; // more haulers in beginning
                return;
            }
            
            room.memory.stats.transports_1k = volume;
            room.memory.stats.transports_1k_30 = Math.round((room.memory.stats.transports_1k_30*29+volume)/30);
            
            //calc haulers needed
            let haulers = _.filter(Game.creeps, (c) => c.memory && c.memory.home == room.name && c.memory.role == "hauler");
            let carries = 0;
            for (let h of haulers) {
                carries += h.body.length * 2 / 3;
            }

            let carryPartPerHauler = Math.round(carries / haulers);
            // take short term and long term into consideration
            let avg_transports = (room.memory.stats.transports_1k + room.memory.stats.transports_1k_30) / 2;
            let haulerNeeded = Math.round(avg_transports / (carryPartPerHauler*50));
            haulerNeeded = Math.max(Math.min(haulerNeeded, moduleSpawn.max_haulers), 1);
            
            if (room.memory.stats.haulers_needed < haulerNeeded) {
                room.memory.stats.haulers_needed++;
                console.log(room.name + ": incr number of haulers");
            } else if (room.memory.stats.haulers_needed > haulerNeeded) {
                room.memory.stats.haulers_needed--;
                console.log(room.name + ": decr number of haulers");
                let hauler = room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role == "hauler" });
                if (hauler.length > room.memory.stats.haulers_needed) {
                    let diff = hauler.length - room.memory.stats.haulers_needed;
                    for (let i = 0; i < diff; i++) {
                        hauler[i].memory.killSelf = true;
                    }
                }
            }
        }
    }
    
    
};