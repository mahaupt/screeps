/*
Memory Layout
role = 'drainer'
home = home room name


troom = room name to start attack
tx = xcord of target pos
ty = ycord of target pos

room_before_troom = room before target room
one_more_step = true/false
*/

module.exports = {
    name: "drainer", 
    boost: ['damage', 'heal', 'fatigue'],
    run: function(creep) {
        baseCreep.init(creep);
        
        //heal self
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
        
        //no target room - go home
        if (!creep.memory.troom) 
        {
            if (!creep.isAtHome) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller);
            }
            delete creep.memory.embark;
            return;
        }
        
        //if target room - prepare for embarkation
        if (!creep.memory.embark) {
            if (baseCreep.prepareCreep(creep)) {
                baseCreep.boostCreep(creep, this.boost);
            }
            return;
        }
        
        
        //intel
        Intel.collectIntel(creep, creep.room);
        
        
        //move to target room
        if (creep.room.name == creep.memory.troom) {
            delete creep.memory.one_more_step;
            
            if (creep.hits > creep.hitsMax*0.7 && !creep.memory.testflee) {
            
                //move in position
                if (creep.memory.tx && creep.memory.ty) {
                    baseCreep.moveTo(creep, creep.memory.tx, creep.memory.ty);
                    creep.say("🛡️");
                } else {
                    var dir = creep.pos.getDirectionTo(25, 25);
                    creep.move(dir);
                    
                    let exit = creep.pos.findInRange(FIND_EXIT, 0);
                    if (exit.length == 0) {
                        creep.memory.tx = creep.pos.x;
                        creep.memory.ty = creep.pos.y;
                    }
                }
                
                //no enemies left - go home
                var enemies = creep.room.find(
                    FIND_HOSTILE_STRUCTURES, 
                    {filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0}
                );
                if (enemies.length <= 0) {
                    delete creep.memory.target;
                }
                
            } else {
                //retreat
                let exit = Game.map.findExit(creep.room.name, creep.memory.room_before_troom);
                if (exit >= 0) {
                    var closest_exit = creep.pos.findClosestByPath(exit);
                    baseCreep.moveTo(creep, closest_exit);
                    creep.say("🏃");
                } else {
                    creep.say("panic");
                }
            }
        } else {
            
            //save room before target room
            creep.memory.room_before_troom = creep.room.name;
            
            if (creep.hits == creep.hitsMax && !creep.memory.testflee) {
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