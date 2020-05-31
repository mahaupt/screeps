//parses room events
module.exports = {
    run: function(room)
    {
        var events = room.getEventLog();
        
        for(var e of events) {
            if (e.event == EVENT_ATTACK) 
            {
                //attack in my room or to my creeps or structures
                var target = Game.getObjectById(e.targetId);
                if (target && target.my || room.controller && room.controller.my) {
                    if (target && target.my && target instanceof Creep) {
                        target.memory.attacked_time = Game.time;
                    }
                    
                    room.attacked_time = Game.time;
                }
            }
        }
    }
    
};