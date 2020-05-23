/*
Soldier
leader = xyz
target = room name to start attack

*/

var roleSoldier = {
    run: function(creep) {
        baseCreep.init(creep);
        
        //no target - go home
        if (!creep.memory.target) 
        {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                creep.moveTo(creep.room.controller);
            }
            return;
        }
        
        
        if (creep.room.name == creep.memory.target) {
            //go destroy target
            var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
            if (target)
            {
                creep.say("⚔️");
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            } else {
                //no targets - move home
                delete creep.memory.target;
            }
        } else {
            baseCreep.moveToRoom(creep, creep.memory.target);
        }
        
    }
};

module.exports = roleSoldier;