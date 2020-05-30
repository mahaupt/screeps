module.exports =  {
    run: function(room) {
        this.getTotalEnergyLevel(room);
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
        
        //stats and time dependent collecting
        if (Game.time % 1000 == 9) {
            if (!room.memory.stats.energy_1k) {
                room.memory.stats.energy_1k = energy;
            }
            
            room.memory.stats.energy_1k_dx = room.memory.stats.energy - room.memory.stats.energy_1k;
            room.memory.stats.energy_1k = energy;
        }
        if (Game.time % 10000 == 9) {
            if (!room.memory.stats.energy_10k) {
                room.memory.stats.energy_10k = energy;
            }
            
            room.memory.stats.energy_10k_dx = room.memory.stats.energy - room.memory.stats.energy_10k;
            room.memory.stats.energy_10k = energy;
        }
    }, 
    
    
};