module.exports = {
    run: function(ops)
    {
        this.init(ops);
    },
    
    
    
    init: function(ops) {
        if (ops.mem.init) return;
        ops.mem.init = true;
        
        
    }
};