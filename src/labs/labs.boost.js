module.exports = {
    run: function(room) 
    {
        
        //work on boost list
        this.workBoostList(room);
    
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
    
    //calculate res demand to fully boost a creep
    calcDemand: function(creep, res) 
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
        return amount;
    }
    
};