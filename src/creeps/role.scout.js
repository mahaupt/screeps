/*
Memory Layout
.role = "scout"
.renewSelf = true/false
.troom = target room name
.home = creep home room name
*/

module.exports =  {
    name: 'scout', 
    run: function(creep) {
        baseCreep.init(creep);
        creep.notifyWhenAttacked(false);
        
        //no target - go home
        if (!creep.memory.troom) 
        {
            this.pickTarget(creep);
            
            if (!creep.isAtHome) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                //idle around controller
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller, {range: 2});
            }
            return;
        }
        
        
        //has target - go scout
        if (creep.room.name != creep.memory.troom) {
            //move to room
            baseCreep.moveToRoom(creep, creep.memory.troom);
        } else {
            //target finished
            delete creep.memory.troom;
        }        
    },
    
    
    pickTarget: function(creep) 
    {
        let min_dist = 9999;
        let selected_troom;

        // select next troom room
        for(let i in Memory.intel.req) {
            let d = Game.map.getRoomLinearDistance(creep.room, Memory.intel.req[i]);
            if (d < min_dist) {
                min_dist = d;
                selected_troom = i;
            }
        }
        if (selected_troom) {
            creep.memory.troom = Memory.intel.req[selected_troom];
            Memory.intel.req.splice(selected_troom, 1);
        } else {
            creep.memory.renewSelf = true;
            creep.memory.killSelf = true;
        }
    },
};