module.exports = {
    run: function(ops)
    {
        this.init(ops);
        
        // SOURCE ROOM NOT AVBL - ABORT
        if (Ops.checkSrcRoomAvbl(ops)) return;
    },
    
    
    
    init: function(ops) {
        if (ops.mem.init) return;
        ops.mem.init = true;
        
        
    }
};