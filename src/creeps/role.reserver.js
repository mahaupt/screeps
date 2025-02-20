module.exports = {
    name: 'reserver',
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //go back home // wait for target
        if (!creep.memory.troom)
        {
            if (!creep.isAtHome) {
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
        
        
        //delete target - invalid
        if (!creep.room.controller || creep.room.controller.my) {
            delete creep.memory.troom;
            return;
        }
        
        
        var res = -1;
        
        if (creep.room.controller.owner) {
            res = creep.attackController(creep.room.controller);
        } else {
            res = creep.reserveController(creep.room.controller);
        }
        
        if (res != ERR_NOT_IN_RANGE) {
            creep.signController(
                creep.room.controller, 
                "Expansion Room"
            );
        }
        
        //in target room
        if (res != OK) {
            baseCreep.moveTo(creep, creep.room.controller);
        }
    }
};