module.exports = {
    startBoost: function(room, res, amount) 
    {
        if (!Lab.resourceAvailable(room, res, amount)) {
            console.log("startBoost: need to buy " + amount + " " + res);
            Terminal.addBuyList(room, res, amount);
        }
        
        console.log("startBoost: start boosting with " + amount + " " + res);
        var lab = this.findFreeLab(room);
        if (lab) 
        {
            //assign lab for boosting
            Labs.startWork(lab, room.memory.labs.labs[lab.id], res, amount, 
                false, null, null, true);
        }
    }, 
    
    
    findFreeLab: function(room) {
        var labs = room.find(FIND_MY_STRUCTURES, {filter: (s) => { 
            return s.structureType == STRUCTURE_LAB &&
                s.mineralType == undefined &&
                room.memory.labs.labs[s.id].state == this.Lab.IDLE; }}
        );
        
        if (labs.length > 0) {
            return labs[0];
        }
        return false;
        
        //maybe find remote lab to not block production
    }, 
    
    //add demand to fully boost a creep
    addDemand: function(creep, res, urgent = false) 
    {
        if (!creep.room.memory.labs.demand) {
            creep.room.memory.labs.demand = [];
        }
        
        var amount = 0;
        
        for (var i in creep.body) 
        {
            //check part is not boosted
            if (creep.body[i].boost == undefined) 
            {
                var part = creep.body[i].type;
                
                //boost with resource exist
                if (BOOSTS[part][res]) {
                    amount += LAB_BOOST_MINERAL;
                }
            }
        }
        
        //no boost possible with body parts and res
        if (amount <= 0) return;
        
        var demand = {
            creep: creep.id,
            res: res,
            amt: amount,
            urgent: urgent
        };
        
        if (urgent) {
            creep.room.memory.labs.demand.unshift(demand);
        } else {
            creep.room.memory.labs.demand.push(demand);
        }
    }, 
    
    removeDemand: function(creep, res, amount=999999) {
        var index = _.findIndex(
            creep.room.memory.labs.demand, 
            (s) => s.creep == creep.id && s.res == res
        );
        
        if (index >= 0) {
            creep.room.memory.labs.demand[index].amt -= amount;
            if (creep.room.memory.labs.demand[index].amt <= 0) {
                creep.room.memory.labs.demand.splice(index, 1);
                return 0;
            }
            return creep.room.memory.labs.demand[index].amt;
        }
        
        return 0;
    }, 
    
    getCreepDemandList: function(room, res, amount)
    {
        var creeps = [];
        var avbl_amount = amount;
        
        for (var i in room.memory.labs.demand) {
            if (room.memory.labs.demand[i].res == res) {
                avbl_amount -= room.memory.labs.demand[i].amt;
                if (avbl_amount >= 0) {
                    creeps.push(room.memory.labs.demand[i].creep);
                } else {
                    return creeps;
                }
            }
        }
        
        return creeps;
    }
    
};