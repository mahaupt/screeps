//var labsProduction = require('labs_labs.production');

module.exports = {
    run: function(room) 
    {
        if (!room.memory.labs) {
            room.memory.labs = {};
        }
        
        var labs = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_LAB});
        for (var lab of labs) {
            
            //request energy
            if (lab.store[RESOURCE_ENERGY] < LAB_ENERGY_CAPACITY) {
                var req_amount = LAB_ENERGY_CAPACITY - lab.store[RESOURCE_ENERGY];
                moduleLogistics.addTransportTask(room, room.storage, lab, req_amount, RESOURCE_ENERGY);
            }
        }
        
        
    }, 
    
    emptyLab: function(lab)
    {
        var target = lab.room.terminal || lab.room.storage;
        if (!target) return;
        var amount = lab.store[lab.mineralType];
        if (amount <= 0) return;
        
        moduleLogistics.addTransportTask(lab.room, lab, target, amount, lab.mineralType);
    }
    
    
    
};