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
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller);
                delete creep.memory.noRenew;
            }
            return;
        }
        
        
        //if target room - prepare for embarkation
        if (!creep.memory.embark) {
            if (baseCreep.prepareCreep(creep)) {
                creep.memory.noRenew = true;
                baseCreep.boostCreep(creep, this.boost);
            }
            return;
        }
        
        
        //intel
        Intel.collectIntel(creep, creep.room);
        
        
        //has target - go scout
        if (creep.room.name != creep.memory.troom) {
            creep.memory.noRenew = true;
            
            //move to room
            baseCreep.moveToRoom(creep, creep.memory.troom);
        } 
        else 
        {            
            var target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
            if (target) {
                creep.say("⚔️");
                if (!creep.pos.inRangeTo(target, 1)) {
                    baseCreep.moveTo(creep, target, {range: 1, visualizePathStyle: {stroke: '#ff0000'}});
                } else {
                    creep.dismantle(target);
                }
            } else {
                creep.memory.killSelf = true;
                creep.memory.renewSelf = true;
                delete creep.memory.troom;
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