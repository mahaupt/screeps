var roleTank = {
    run: function(creep) {
        baseCreep.init(creep);
        
        //heal self
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
        
        //no target room - go home
        if (!creep.memory.troom) 
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
            delete creep.memory.embark;
            return;
        }
        
        //if target room - prepare for embarkation
        if (!creep.memory.embark) {
            baseCreep.prepareCreep(creep);
            return;
        }
        
        
        //move to target room
        if (creep.room.name == creep.memory.troom) {
            delete creep.memory.one_more_step;
            
            if (creep.hits > creep.hitsMax*0.7) {
            
                //move in position
                if (creep.memory.tx && creep.memory.ty) {
                    var pos = new RoomPosition(creep.memory.tx, creep.memory.ty, creep.room.name);
                    creep.moveTo(pos);
                    creep.say("🛡️");
                }
                
            } else {
                //retreat
                creep.move(RIGHT);
                creep.say("🏃");
            }
        } else {
            if (creep.hits == creep.hitsMax) {
                baseCreep.moveToRoom(creep, creep.memory.troom);
            } else {
                //wait for heal
                creep.say("🏃");
                if (!creep.memory.one_more_step && creep.fatigue == 0) {
                    if (creep.move(RIGHT) == OK) {
                        creep.memory.one_more_step = true;
                    }
                }
            }
        }
    },
}

module.exports = roleTank;