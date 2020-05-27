// {res_a: , res_b: , prod: , amount: , started: false, lab_a: , lab_b: , lab_prod: }

module.exports = {
    startProduction: function(room, res, amount)
    {
        if (this.resourceAvailable(room, res, amount)) {
            return;
        }
        if (this.isBaseMineral(res)) {
            //moduleTerminal.addBuyList(room, res, amount);
            console.log("Buying " + res);
            return;
        }
        
        //start production
        var base = this.getBaseMinerals(res);
        this.startProduction(room, base.a, amount);
        this.startProduction(room, base.b, amount);
        
        //insert into production queue
        this.insertProductionQueue(room, base.a, base.b, res, amount);
        console.log("Producing " + res);
    }, 
    
    insertProductionQueue: function(room, res_a, res_b, res_prod, amount)
    {
        if (!room.memory.labs.list) {
            room.memory.labs.list = [];
        }
        
        var task = {
            res_a: res_a,
            res_b: res_b,
            prod: res_prod,
            amount: amount,
            started: false,
            lab_a: null,
            lab_b: null,
            lab_prod: null
        };
        
        room.memory.labs.list.push(task);
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
    
    buyResource: function(res, amount)
    {
        console.log("Buying " + amount + " " + res);
    }, 
    
    
    isBaseMineral: function(res)
    {
        if (res == RESOURCE_HYDROGEN || 
            res == RESOURCE_OXYGEN || 
            res == RESOURCE_UTRIUM ||
            res == RESOURCE_LEMERGIUM ||
            res == RESOURCE_KEANIUM || 
            res == RESOURCE_ZYNTHIUM || 
            res == RESOURCE_CATALYST)
        {
            return true;
        } else {
            return false;
        }
    }, 
    
    
    getBaseMinerals: function(res)
    {
        for(var a in REACTIONS) {
            for(var b in REACTIONS[a]) {
                if (REACTIONS[a][b] == res) {
                    return {a: a, b: b};
                }
            }
        }
        console.log("nothing found for " + res);
    }
};