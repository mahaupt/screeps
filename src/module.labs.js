module.exports = {
    run: function(room)
    {
        var labs = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_LAB});
        for (var lab of labs) {
            
            //request energy
            if (lab.store[RESOURCE_ENERGY] < LAB_ENERGY_CAPACITY) {
                var req_amount = LAB_ENERGY_CAPACITY - lab.store[RESOURCE_ENERGY];
                this.requestResource(lab, amount, lab.room.storage, RESOURCE_ENERGY);
            }
        }
    }, 
    
    requestResource: function(lab, amount, source, resource_type) {
        var task = {
            p: 4,
            t: 't',
            s: source.id,
            v: amount,
            a: 0,
            r: lab.id,
            res: resource_type
        };
        moduleLogistics.insertOrUpdate(lab.room, task);
    }, 
    
    emptyLab: function(lab)
    {
        var target = lab.room.terminal || lab.room.storage;
        if (!target) return;
        var amount = lab.store[lab.mineralType];
        if (amount <= 0) return;
        
        var task = {
            p: 4,
            t: 't',
            s: lab.id,
            v: amount,
            a: 0,
            r: target,
            res: lab.mineralType
        };
        moduleLogistics.insertOrUpdate(lab.room, task);
    }
};


