/*
Memory Layout
.role = "scout"
.renewSelf = true/false
.target = room.name
.home = creep home room name
*/

var roleScout =  {
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
        
        
        //has target - go scout
        if (creep.room.name != creep.memory.target) {
            //move to room
            baseCreep.moveToRoom(creep, creep.memory.target);
        } else {
            //scout
            roleScout.collectIntel(creep, creep.room);
            
            delete creep.memory.target;
            //creep.memory.renewSelf = true;
            //creep.memory.killSelf = true;
        }
    }, 
    
    
    collectIntel: function(creep, room) {
        var creeps = room.find(FIND_CREEPS);
        var struct = room.find(FIND_STRUCTURES);
        
        var intel = {};
        intel.name = room.name;
        intel.energyAvailable = room.energyAvailable;
        intel.energyCapacityAvailable = room.energyCapacityAvailable;
        intel.time = Game.time;
        intel.creeps = [];
        intel.structures = [];
        
        for (let i=0; i < creeps.length; i++)
        {
            //skip own creeps
            if (creeps[i].owner) {
                if (creeps[i].owner.username == creep.owner.username) continue;
            }
            var cintel = {};
            cintel.body = creeps[i].body;
            cintel.hits = creeps[i].hits;
            cintel.hitsMax = creeps[i].hitsMax;
            cintel.owner = creeps[i].owner;
            cintel.pos = {};
            cintel.pos.x = creeps[i].pos.x;
            cintel.pos.y = creeps[i].pos.y;
            
            intel.creeps.push(cintel);
        }
        
        for (let i=0; i < struct.length; i++)
        {
            //skip own structs
            if (struct[i].owner) {
                if (struct[i].owner.username == creep.owner.username) continue;
            }
            var sintel = {};
            sintel.structureType = struct[i].structureType;
            sintel.hits = struct[i].hits;
            sintel.hitsMax = struct[i].hitsMax;
            sintel.owner = struct[i].owner;
            sintel.pos = {};
            sintel.pos.x = struct[i].pos.x;
            sintel.pos.y = struct[i].pos.y;
            
            intel.structures.push(sintel);
        }
        
        //save intel
        if (!Memory.intel) Memory.intel = {};
        if (Memory.intel[room.name]) delete Memory.intel[room.name];
        Memory.intel[room.name] = intel;
    }
    
    
    
};


module.exports = roleScout;