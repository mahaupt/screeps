module.exports = {
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //cannot be renewed
        creep.memory.noRenew = true;
        
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
        
        //collect intel        
        baseCreep.collectIntel(creep, creep.room);
        
        //move to target room
        if (creep.room.name != creep.memory.troom)
        {
            baseCreep.moveToRoom(creep, creep.memory.troom);
            return;
        }
        
        
        //delete target - invalid
        if (!creep.room.controller || creep.room.controller.my) {
            delete creep.memory.troom;
            return;
        }
        
        
        //in target room
        var res = creep.reserveController(creep.room.controller);
        if (res != OK) {
            creep.moveTo(creep.room.controller);
        }
    }
};