/*
Memory Layout
.role = "scout"
.renewSelf = true/false
.target = room.name
.home = creep home room name
*/

module.exports =  {
    run: function(creep) {
        baseCreep.init(creep);
        
        //no target - go home
        if (!creep.memory.target) 
        {
            this.pickTarget(creep);
            
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
            
            if (!Memory.intel[creep.room.name] || 
                Memory.intel[creep.room.name].time < Game.time-100) 
            {
                this.collectIntel(creep, creep.room);
            }
        } else {
            //scout
            this.collectIntel(creep, creep.room);
            
            delete creep.memory.target;
        }
    }, 
    
    
    collectIntel: function(creep, room) {
        //skip own rooms
        if (room.controller && room.controller.my) {
            return;
        }
        
        var creeps = room.find(FIND_HOSTILE_CREEPS);
        var struct = room.find(FIND_HOSTILE_STRUCTURES);
        var minerals = room.find(FIND_MINERALS);
        var source_keeper = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR});
        var invaterCores = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_INVADER_CORE});
        
        
        var intel = {};
        intel.name = room.name;
        intel.time = Game.time;
        intel.sources = room.find(FIND_SOURCES).length;
        intel.minerals = minerals[0].mineralType || null;
        intel.threat = "none";
        if (invaterCores.length > 0) {
            intel.threat = "core";
        } else if (source_keeper.length > 0) {
            intel.threat = "keeper";
        }
        
        intel.ctrl = false;
        intel.ctrl_lvl = 0;
        if (room.controller) {
            intel.ctrl = true;
            intel.ctrl_lvl = room.controller.level;
            
            if (room.controller.owner) {
                intel.threat = "player";
            }
        }
        
        intel.creeps = creeps.length;
        intel.structs = struct.length;
        
        //save intel
        if (!Memory.intel) Memory.intel = {};
        if (Memory.intel[room.name]) delete Memory.intel[room.name];
        Memory.intel[room.name] = intel;
    }, 
    
    
    pickTarget: function(creep) 
    {
        if (Memory.req_intel && Memory.req_intel.length > 0) {
            creep.memory.target = Memory.req_intel.shift();
        } else {
            creep.memory.renewSelf = true;
            creep.memory.killSelf = true;
        }
    },
    
    
    
};