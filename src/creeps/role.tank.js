module.exports = {
    name: "tank", 
    boost_res: ['GO', 'LO', 'ZO'],
    run: function(creep) {
        name: 'tank', 
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
            if (baseCreep.prepareCreep(creep)) {
                baseCreep.boostCreep(creep, this.boost_res);
            }
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
                var exit = Game.map.findExit(creep.room.name, creep.memory.room_before_troom);
                if (exit >= 0) {
                    var closest_exit = creep.pos.findClosestByPath(exit);
                    creep.moveTo(closest_exit);
                    creep.say("🏃");
                } else {
                    creep.say("panic");
                }
            }
        } else {
            
            //save room before target room
            creep.memory.room_before_troom = creep.room.name;
            
            if (creep.hits == creep.hitsMax) {
                baseCreep.moveToRoom(creep, creep.memory.troom);
            } else {
                //wait for heal
                creep.say("🏃");
                if (!creep.memory.one_more_step && creep.fatigue == 0) 
                {
                    var direction = creep.pos.getDirectionTo(25, 25);
                    if (creep.move(direction) == OK) {
                        creep.memory.one_more_step = true;
                    }
                }
            }
        }
    },
};