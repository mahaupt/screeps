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
        this.Boost.run(room);
        this.memCleanup(room);
        
        
        //autoproduce
        if (Game.market.credits < 10000) return;
        if (labs.length >= 3 && 
            (!room.memory.labs.production || room.memory.labs.production.length == 0)) 
        {
            if (!this.resourceAvailable(room, "GO", 1500)) {
                Labs.Production.startProduction(room, "GO", 3000);
                return;
            }
            if (!this.resourceAvailable(room, "UH", 1500)) {
                Labs.Production.startProduction(room, "UH", 3000);
                return;
            }
            if (!this.resourceAvailable(room, "KO", 1500)) {
                Labs.Production.startProduction(room, "KO", 3000);
                return;
            }
            if (!this.resourceAvailable(room, "LO", 1500)) {
                Labs.Production.startProduction(room, "LO", 3000);
                return;
            }
            if (!this.resourceAvailable(room, "ZO", 1500)) {
                Labs.Production.startProduction(room, "ZO", 3000);
                return;
            }
        }
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