module.exports = {
    startProduction: function(room, res, amount)
    {
        if (this.resourceAvailable(res, amount)) {
            return;
        }
        if (this.isBaseMineral(res)) {
            this.buyResource(res, amount);
            return;
        }
        
        //start production
        var base = this.getBaseMinerals(res);
        this.startProduction(base.a, amount);
        this.startProduction(base.b, amount);
        
        //insert into production queue
        this.insertProductionQueue(room, base.a, base.b, res, amount);
    }, 
    
    insertProductionQueue: function(room, res_a, res_b, res_prod, amount)
    {
        if (!room.memory.labs.production) {
            room.memory.labs.production = [];
        }
        
        var task = {
            res_a: res_a,
            res_b: res_b,
            prod: res_prod,
            amount: amount
        };
        
        room.memory.labs.production.push(task);
    }, 
    
    resourceAvailable: function(res, amount)
    {
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
    }
};