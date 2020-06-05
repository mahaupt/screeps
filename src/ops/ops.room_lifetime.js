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
        
        //AUTO CLAIM NEW ROOMS
        var myrooms = _.filter(Game.rooms, (s) => s.controller && s.controller.my);
        if (myrooms.length < Game.gcl) 
        {
            //todo: pick best room
            
        }
        
        //AUTO HARVEST OPS
        for (var i in Memory.intel.list) {
            var intel = Memory.intel.list[i];
            if (intel.threat != "none") continue;
            
            var dist = Game.map.getRoomLinearDistance(ops.source, intel.name, true);
            if (dist <= 1) 
            {
                //source and mineral ops
                //check if no harvest ops exist
                var j = _.findIndex(Memory.ops, (o) => { return o.target == intel.name; });
                if (j < 0) {
                    Ops.new("harvest", ops.source, intel.name);
                    return;
                }
            }
        }
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.cycle_timeout = Game.time;

    }
};