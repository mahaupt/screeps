module.exports = {
    cycle_timeout: 30000,
    run: function(ops)
    {
        this.init(ops);

        //calculates possible base positions for nearby rooms
        
        //picks best room for next base
        
        //reserves room
        
        // 10000 cycle timeout
        if (ops.mem.cycle_timeout + this.cycle_timeout > Game.time) return;
        ops.mem.cycle_timeout = Game.time;
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
        
        Ops.new("scout_vicinity", ops.source, "");
    }, 
    
    
    sendScouts: function(ops)
    {
        //scout timeout
        if (ops.mem.scout_timeout + this.scout_timeout > Game.time) return;
        ops.mem.scout_timeout = Game.time;
        
        var target = ops.mem.nearby[ops.mem.nearby_id];
        
        //skip own room scouting
        var room = Game.rooms[target];
        if (room && room.controller && room.controller.my) {
            ops.mem.nearby_id++;
            return;
        }
        
        //start scout
        Ops.new("scout", ops.source, target);
        ops.mem.nearby_id++;
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.cycle_timeout = Game.time;

    }
};