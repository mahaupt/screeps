module.exports = {
    Lab: require('labs_labs.lab'),
    Production: require('labs_labs.production'),
    
    run: function(room) 
    {
        if (!room.memory.labs) {
            room.memory.labs = {};
        }
        if (!room.memory.labs.labs) {
            room.memory.labs.labs = {};
        }
        
        //run lab state machines
        var labs = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_LAB});
        for (var lab of labs) 
        {
            if (!room.memory.labs.labs[lab.id]) {
                room.memory.labs.labs[lab.id] = {};
            }
            this.Lab.run(lab, room.memory.labs.labs[lab.id]);
        }
        
        
        //assign production to labs
        if (Game.time % 20 != 3) return;
        if (room.memory.labs.list && room.memory.labs.list.length > 0)
        {
            //check if already started
            var prod = room.memory.labs.list[0];
            if (prod.amount <= 0) { room.memory.labs.list.shift(); return; }
            if (prod.started) return;
            
            //find empty lab with 2 or more empty labs in range
            var prod_lab = room.find(FIND_STRUCTURES, 
                {filter: (s) => { 
                    return s.structureType == STRUCTURE_LAB &&
                        s.mineralType == undefined &&
                        room.memory.labs.labs[s.id].state == this.Lab.IDLE && 
                        s.pos.findInRange(FIND_STRUCTURES, 2, 
                            {filter: (s2) => s2.structureType == STRUCTURE_LAB && 
                                s2.mineralType == undefined && 
                                room.memory.labs.labs[s2.id].state == this.Lab.IDLE}
                        ).length >= 3;
                }}
            );
            if (prod_lab.length > 0) 
            {
                //get resource labs in range
                prod_lab = prod_lab[0];
                var res_labs = prod_lab.pos.findInRange(
                    FIND_STRUCTURES, 
                    2, 
                    {filter: (s2) => s2.structureType == STRUCTURE_LAB && 
                    s2.id != prod_lab.id && 
                    s2.mineralType == undefined && 
                    room.memory.labs.labs[s2.id].state == this.Lab.IDLE}
                );
                
                if (res_labs.length >= 2) 
                {
                    prod.started = true;
                    prod.lab_prod = prod_lab.id;
                    prod.lab_a = res_labs[0].id;
                    prod.lab_b = res_labs[1].id;
                    
                    // Product
                    this.Lab.startWork(
                        prod_lab, 
                        room.memory.labs.labs[prod_lab.id], 
                        prod.prod, 
                        prod.amount, 
                        true,
                        res_labs[0].id, 
                        res_labs[1].id
                    );
                        
                    // Resource A
                    this.Lab.startWork(
                        res_labs[0], 
                        room.memory.labs.labs[res_labs[0].id], 
                        prod.res_a, 
                        prod.amount, 
                        false
                    );
                    
                    // Resource B
                    this.Lab.startWork(
                        res_labs[1], 
                        room.memory.labs.labs[res_labs[1].id], 
                        prod.res_b, 
                        prod.amount, 
                        false
                    );
                }
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