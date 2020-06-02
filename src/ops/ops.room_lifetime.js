module.exports = {
    cycle_timeout: 30000,
    run: function(ops)
    {
        this.init(ops);

        //calculates possible base positions for nearby rooms
        
        //picks best room for next base
        
        //reserves room
        
        // 30000 cycle timeout
        if (ops.mem.cycle_timeout + this.cycle_timeout > Game.time) return;
        ops.mem.cycle_timeout = Game.time;
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
        
        Ops.new("scout_vicinity", ops.source, "");
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.cycle_timeout = Game.time;

    }
};