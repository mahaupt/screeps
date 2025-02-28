module.exports = {
    name: "dismantler",
    boost: ['dismantle'],
    
    run: function(creep)
    {
        baseCreep.init(creep);
        this.healSelf(creep);
        
        //no target - go home
        if (!creep.memory.troom) 
        {            
            if (!creep.isAtHome) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller);
            }
            return;
        }
        
        
        //if target room - prepare for embarkation
        if (!creep.memory.embark) {
            if (baseCreep.prepareCreep(creep)) {
                baseCreep.boostCreep(creep, this.boost);
            }
            return;
        }
        
        
        //intel
        Intel.collectIntel(creep, creep.room);
        
        
        //has target - go scout
        if (creep.room.name != creep.memory.troom) {            
            baseCreep.moveToRoom(creep, creep.memory.troom);
        } 
        else 
        {
            let target;
            if (creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
                if (!target) delete creep.memory.target;
            }
            if (!creep.memory.target) {
                target = !creep.memory.stypes 
                    ? creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES) 
                    : creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType == creep.memory.stypes});
                if (target) creep.memory.target = target.id;
            }
            
            // done - no more targets
            if (!target) {
                creep.memory.killSelf = true;
                creep.memory.renewSelf = true;
                delete creep.memory.troom;
                delete creep.memory.target;
                return
            }

            // attack
            creep.say("⚔️");
            if (!creep.pos.inRangeTo(target, 1)) {
                baseCreep.moveTo(creep, target, {range: 1});
            } else {
                creep.dismantle(target);
            }
        }
        
        
    }, 
    
    healSelf: function(creep)
    {
        //heal self function
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        } else {
            //heal others
            var targets = creep.pos.findInRange(FIND_MY_CREEPS, 1, {filter: (s) => s.hits < s.hitsMax });
            if (targets.length > 0) {
                creep.heal(targets[0]);
            }
        }
    }, 
};