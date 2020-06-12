/*
Memory Layout
.role = "scout"
.renewSelf = true/false
.troom = room.name
.home = creep home room name
*/

module.exports =  {
    name: 'scout', 
    run: function(creep) {
        baseCreep.init(creep);
        
        //no target - go home
        if (!creep.memory.troom) 
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
                delete creep.memory.noRenew;
            }
            return;
        }
        
        
        //has target - go scout
        if (creep.room.name != creep.memory.troom) {
            creep.memory.noRenew = true;
            
            //move to room
            baseCreep.moveToRoom(creep, creep.memory.troom);
        } else {
            //target finished
            delete creep.memory.troom;
        }
        
        //scout
        Intel.collectIntel(creep, creep.room);
    },
    
    
    pickTarget: function(creep) 
    {
        if (Memory.intel && Memory.intel.req && Memory.intel.req.length > 0) {
            creep.memory.troom = Memory.intel.req.shift();
        } else {
            creep.memory.renewSelf = true;
            creep.memory.killSelf = true;
        }
    },
    
    
    
};