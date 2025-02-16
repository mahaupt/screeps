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
                baseCreep.moveTo(creep, creep.room.controller);
            }
            return;
        }
        
        //collect intel        
        Intel.collectIntel(creep, creep.room);
        
        //move to target room
        if (creep.room.name != creep.memory.troom)
        {
            baseCreep.moveToRoom(creep, creep.memory.troom);
            return;
        }
        
        //capture controller
        if (!creep.room.controller.my) {
            if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
                baseCreep.moveTo(creep, creep.room.controller);
            } else {
                creep.claimController(creep.room.controller);
            }
        } else {
            //go back and kill self
            delete creep.memory.troom;
            creep.memory.killSelf = true;
            creep.memory.renewSelf = true;
        }
        
        
    },
};