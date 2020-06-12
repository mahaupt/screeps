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
            
            //room is mine
            var room = Game.rooms[cabl.room];
            if (room && room.controller && room.controller.my) {
                //own room - delete from list
                if (room.memory.center) {
                    //just check if center is already set before deleting
                    Memory.intel.claimable.splice(i, 1);
                    return;
                }
            }
            
            //room is already parsed
            if (cabl.parsed) continue;
            
            
            //get progress
            var progress = cabl.prog || 0;
            var j = 0;
            var k = 0;
            
            //get terrain cost matrix
            var costs = PathFinder.CostMatrix.deserialize(cabl.terrain);
            
            //calc
            var startc = 1+this.base_size;
            var endc = 48-this.base_size;
            
            //start variable
            //var dx = endc - startc + 1;
            //var jumpx = Math.floor(progress / dx);
            
            for (var x = startc; x <= endc; x++) {
                for (var y = startc; y <= endc; y++) {
                    if (j < progress) { j++; continue; }
                    
                    //calc and save position
                    let points = this.valueBasePos(new RoomPosition(x, y, cabl.room), costs);
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
                    if (k >= 50) return;
                }
            } //for
            
            //finished - cleanup
            cabl.parsed = true;
            delete cabl.terrain;
        }
    },
    
    
    valueBasePos: function(pos, costs)
    {
        var points = 0;
        var baseSize = 7;
        
        //distance to sources
        //nope
        
        //free positions to build
        for (var x = pos.x-baseSize; x <= pos.x+baseSize; x++) {
            for (var y = pos.y-baseSize; y <= pos.y+baseSize; y++) {
                points -= costs.get(x, y);
            }
        }
        
        
        //distance to center
        var centerPoint = new RoomPosition(25, 25, pos.roomName);
        var dist = centerPoint.getRangeTo(pos);
        points -= dist*5;
        
        
        return points;
    },
};