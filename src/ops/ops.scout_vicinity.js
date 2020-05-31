module.exports = {
    scout_timeout: 100,
    run: function(ops)
    {
        this.init(ops);
        
        // scouting finished
        if (ops.mem.nearby_id >= ops.mem.nearby.length) 
        {
            //scouting completed
            ops.finished = true;
            return;
        }
        
        //scout timeout
        if (ops.mem.scout_timeout + this.scout_timeout > Game.time) return;
        ops.mem.scout_timeout = Game.time;
        
        this.sendScouts(ops);
    }, 
    
    
    sendScouts: function(ops)
    {
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
        ops.mem.scout_timeout = 0;
        
        var range = 3;
        if (ops.mem.range) {
            range = ops.mem.range;
        }
        
        ops.mem.nearby = this.getRoomsNearby(ops.source, range);
        ops.mem.nearby_id = 0;
    }, 
    
    getRoomsNearby: function(roomname, range)
    {
        if (range <= 0) return [];
        var exits = Game.map.describeExits(roomname);
        var ret = [];
        
        for(let i of Object.keys(exits)) {
            ret.push(exits[i]);    
        }
        for(let i of Object.keys(exits)) {
            var rooms = this.getRoomsNearby(exits[i], range-1);
            ret = [].concat(ret, rooms);
        }
        
        //remove doubles
        _.uniq(ret);
        return ret;
    }
};