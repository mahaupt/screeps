var moduleStats =  {
    run: function(room) {
        moduleStats.getTotalEnergyLevel(room);
    },
    
    
    getTotalEnergyLevel: function(room) {
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
        
        room.memory.total_energy = energy;
        room.memory.total_capacity = capacity;
    }, 
    
    
};

module.exports = moduleStats;