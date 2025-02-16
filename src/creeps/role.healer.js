/*
Memory Layout
role = 'healer'
home = home room name
target = creep.id
*/

module.exports = {
    name: "healer",
    boost: ['heal'], 
    
    run: function(creep)
    {
        baseCreep.init(creep);
        
        if (!creep.memory.target) {
            this.healSelf(creep);
            if (creep.memory.home != creep.room.name) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller);
            }
            return;
        }
        
        var target = Game.getObjectById(creep.memory.target);
        if (!target) {
            target = this.pickTarget(creep);
            if (!target) {
                delete creep.memory.target;
                return;
            }
        }
        
        baseCreep.moveTo(creep, target);
        this.healTarget(creep, target);
    }, 
    
    
    healSelf: function(creep) {
        //heal self
        if (creep.hits < creep.hitsMax) 
        {
            creep.heal(creep);
            return true;
        }
        return false
    }, 
    
    
    healTarget: function(creep, target) {
        
        if (this.healSelf(creep)) return;
        
        //heal target
        if (target.hits < target.hitsMax) {
            if (creep.heal(target) == ERR_NOT_IN_RANGE) {
                creep.rangedHeal(target);
            }
            return;
        }
        
        //heal other
        var damaged = creep.pos.findInRange(FIND_MY_CREEPS, 3, {filter: (c) => c.hits < c.hitsMax});
        if (damaged > 0) {
            if (creep.heal(damaged[0]) == ERR_NOT_IN_RANGE) {
                creep.rangedHeal(damaged[0]);
            }
            return;
        }
    },
    
    
    pickTarget: function(creep) {
        var t = creep.pos.findClosestByPath(
            FIND_MY_CREEPS, 
            {filter: (c) => c.memory.role == 'soldier' || c.memory.role == 'dismantler'}
        );
        
        if (t) {
            creep.memory.target = t.id;
            return t;
        }
    }
};