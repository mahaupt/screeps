module.exports = {
    Lab: require('labs_labs.lab'),
    Production: require('labs_labs.production'),
    Boost: require('labs_labs.boost'), 
    
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
        if (Game.time % 20 != 5) return;
        this.Production.run(room);
        this.memCleanup(room);
    },
    
    
    
    
    memCleanup: function(room)
    {
        for(var i in room.memory.labs.labs)
        {
            if (!Game.getObjectById(i)) {
                delete room.memory.labs.labs[i];
            }
        }
    }, 
    
    
    resourceAvailable: function(room, res, amount)
    {
        var source = room.terminal || room.storage;
        if (!source) return false;
        
        var avbl_amount = source.store[res];
        if (avbl_amount >= amount) {
            return true;
        } else {
            return false;
        }
        
        return false;
    },
    
    
    
};