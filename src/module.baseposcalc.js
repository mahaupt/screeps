module.exports = {
    base_size: 7,
    
    
    run: function() 
    {
        if (!Memory.intel || !Memory.intel.claimable) return;
        
        //no remaining cpu - abort
        var cpu_avbl = Game.cpu.limit - Game.cpu.getUsed() - 1;
        if (cpu_avbl < 0) return;
        
        for (var i in Memory.intel.claimable) 
        {
            
            //getting claimable object
            var cabl = Memory.intel.claimable[i];
            
            //room is visible
            var room = Game.rooms[cabl.room];
            if (!room) continue;
            if (room.controller && room.controller.my) {
                //own room - delete from lis
                Memory.intel.claimable.splice(i, 1);
                return;
            }
            //room is already parsed
            if (cabl.parsed) continue;
            
            
            //get progress
            var progress = cabl.prog || 0;
            var j = 0;
            var k = 0;
            
            //calc
            var startc = 1+this.base_size;
            var endc = 48-this.base_size;
            
            
            
            for (var x = startc; x <= endc; x++) {
                for (var y = startc; y <= endc; y++) {
                    if (j < progress) { j++; continue; }
                    
                    //calc and save position
                    let points = this.valueBasePos(room, room.getPositionAt(x, y));
                    if (cabl.points === undefined || points > cabl.points) {
                        cabl.points = points;
                        cabl.center = {x: x, y: y};
                    }
                    
                    //save progress
                    j++;
                    k++;
                    cabl.prog = j;
                    
                    //no remaining cpu - abort
                    cpu_avbl = Game.cpu.limit - Game.cpu.getUsed() - 1;
                    if (cpu_avbl < 0) return;
                    if (k >= 20) return;
                }
            } //for
            
            //finished
            cabl.parsed = true;
        }
    },
    
    
    valueBasePos: function(room, pos)
    {
        var points = 0;
        var baseSize = 7;
        
        //distance to sources
        var sources = room.find(FIND_SOURCES);
        for (var i=0; i < sources.length; i++) {
            var path = pos.findPathTo(sources[i]);
            
            if (!path.length)
            {
                points -= 9999;
            } else {
                points -= path.length*5;
            }
        }
        
        //free positions to build
        var places = room.lookAtArea(
            pos.y-baseSize, 
            pos.x-baseSize, 
            pos.y+baseSize, 
            pos.x+baseSize, 
            true);
        for(var i=0; i < places.length; i++)
        {
            if (places[i].terrain == 'plain')
            {
                points += 1;
            }
            if (places[i].terrain == 'swamp')
            {
                points -= 1;
            }
            if (places[i].terrain == 'wall')
            {
                points -= 50;
            }
        }
        
        //distance to exit
        var exits = [];
        exits.push(pos.findClosestByPath(FIND_EXIT_TOP));
        exits.push(pos.findClosestByPath(FIND_EXIT_RIGHT));
        exits.push(pos.findClosestByPath(FIND_EXIT_BOTTOM));
        exits.push(pos.findClosestByPath(FIND_EXIT_LEFT));
        
        for (var i=0; i < exits.length; i++)
        {
            if (!exits[i]) continue;
            var path = pos.findPathTo(exits[i]);
            
            if (!path.length)
            {
                points += 50*2;
            } else {
                //the longer the better
                points += path.length*2;
            }
        }
        
        return points;
    },
};