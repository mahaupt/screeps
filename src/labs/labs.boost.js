module.exports = {
    run: function(room) 
    {
        if (!room.memory.labs.demand) {
            room.memory.labs.demand = [];
        }
        
        //work on boost list
        this.workBoostList(room);
                
        //Go through demand list and add demands
        var urgent_request = {};
        var nonurgent_request = {};
        for (let demand of room.memory.labs.demand) {
            
            //URGENT
            if (demand.urgent && !demand.started) 
            {
                if (!urgent_request[demand.res]) {
                    urgent_request[demand.res] = 0;
                }
                urgent_request[demand.res] += demand.amt;
                demand.started = true;
            }
            
            //NON URGENT
            if (!demand.urgent && !demand.started)
            {
                if (!nonurgent_request[demand.res]) {
                    nonurgent_request[demand.res] = 0;
                }
                nonurgent_request[demand.res] += demand.amt;
                demand.started = true;
            }
        }
        for(let res in urgent_request) {
            this.startBoost(room, res, urgent_request[res], true);
        }
        for(let res in nonurgent_request) {
            Labs.Production.startProduction(room, res, nonurgent_request[res], true);
        }
    
    }, 
    
    
    startBoost: function(room, res, amount, urgent=false) 
    {
        if (!Labs.resourceAvailable(room, res, amount)) {
            console.log("startBoost: buylist " + amount + " " + res);
            Terminal.addBuyList(room, res, amount);
        }
        
        var lab = this.findFreeLab(room);
        
        if (lab && false) 
        {
            //assign lab for boosting
            Labs.startWork(lab, room.memory.labs.labs[lab.id], res, amount, 
                false, null, null, true);
        } else {
            //no free labs, add to list and check later
            room.memory.labs.boost.push({res: res, amt: amount});
            
            if (urgent) {
                //todo: stop production
            }
        }
    }, 
    
    
    workBoostList: function(room)
    {
        if (!room.memory.labs.boost) 
        {
            room.memory.labs.boost = [];
        }
        
        for (var i in room.memory.labs.boost) {
            var lab = this.findFreeLab(room);
            if (lab)
            {
                var boost = room.memory.labs.boost[i];
                Labs.startWork(lab, room.memory.labs.labs[lab.id], boost.res, boost.amt, 
                    false, null, null, true);
                room.memory.labs.boost.splice(i, 1);
                return;
            } else {
                return;
            }
        }
    }, 
    
    
    findFreeLab: function(room) {
        var labs = room.find(FIND_MY_STRUCTURES, {filter: (s) => { 
            return s.structureType == STRUCTURE_LAB &&
                s.mineralType == undefined &&
                room.memory.labs.labs[s.id].state == Labs.Lab.IDLE; }}
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
            urgent: urgent,
            started: false,
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