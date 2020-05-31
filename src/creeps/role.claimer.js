/*
Memory Layout
role = 'claimer'
home = home room name

troom = room name of target
*/

module.exports = {
    name: 'claimer', 
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //go back home // wait for target
        if (!creep.memory.troom)
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
        if (creep.room.name != creep.memory.troom)
        {
            baseCreep.moveToRoom(creep, creep.memory.troom);
            return;
        }
        
        //capture controller
        if (!creep.room.controller.my) {
            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } else {
            //go back and kill self
            delete creep.memory.troom;
            creep.memory.killSelf = true;
            creep.memory.renewSelf = true;
        }
        
        
    },
};