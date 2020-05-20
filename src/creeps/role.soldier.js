/*
Soldier
target = room name
targetx = room x
targety = room y
targett = attack / defend / guard

*/

var roleSoldier = {
    run: function(creep) {
        baseCreep.init(creep);
        
        //no target - go home
        if (!creep.memory.target) 
        {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.room.home);
            }
            else 
            {
                //idle around controller
                creep.moveTo(creep.room.controller);
            }
            return;
        }
        
        
        //go destroy target
    }
};

module.exports = roleSoldier;