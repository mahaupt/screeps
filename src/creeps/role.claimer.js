// Game.spawns.Spawn1.spawnCreep([CLAIM, MOVE], "Claimer", {memory: {role: 'claimer', target: 'W7N3'}})
// [CLAIM, MOVE]

var rolePioneer = {
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //go back home // wait for target
        if (!creep.memory.target)
        {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                creep.say("😴");
                creep.moveTo(creep.room.controller);
            }
            return;
        }
        
        //move to target room
        if (creep.room.name != creep.memory.target)
        {
            baseCreep.moveToRoom(creep, creep.memory.target);
            return;
        }
        
        //capture controller
        if (!creep.room.controller.my) {
            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } else {
            //go back and kill self
            delete creep.memory.target;
            creep.memory.killSelf = true;
        }
        
        
    },
};


module.exports = rolePioneer;