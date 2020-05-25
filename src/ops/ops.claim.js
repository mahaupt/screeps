module.exports = {
    pioneerGroupSize: 5,
    stateTimeout: 2000, 
    PREPARE: 'prepare',
    EMBARK: 'embark',
    BUILDING: 'building',
    
    run: function(ops)
    {
        this.init(ops);
        
        //timeout check
        if (ops.mem.timeout > Game.time && !ops.mem.skip_timeout) return;
        ops.mem.timeout = Game.time + 50;
        ops.mem.skip_timeout = false;
        
        //states
        if (ops.mem.state == this.PREPARE) 
        {
            //have all pioneers spawned?
            var room = Game.rooms[ops.source];
            let pioneers = room.find(FIND_MY_CREEPS, 
                {filter: (c) => c.memory.role == 'pioneer' && !c.memory.target}
            );
            if (pioneers.length >= this.pioneerGroupSize) 
            {
                //skip timeout to get claimer spawned
                ops.mem.skip_timeout = true;
                let spawns = Game.rooms[ops.source].find(
                    FIND_STRUCTURES, 
                    {filter: (s) => s.structureType == STRUCTURE_SPAWN}
                );
                
                //spawn of claimer successful
                if (spawns.length > 0 && 
                    moduleSpawn.spawn(spawns[0], "claimer", {target: ops.target}))
                {
                    //set target of pioneers
                    for (var i = 0; i < pioneers.length; i++)
                    {
                        pioneers[i].memory.target = ops.target;
                    }
                    
                    //next state
                    ops.mem.state = this.EMBARK;
                    ops.mem.state_started = Game.time;
                    ops.mem.timeout = Game.time + 100;
                    return;
                }
            }
            
            //spawn failed somehow - delete or retry?
            if (ops.mem.state_started + this.stateTimeout < Game.time) {
                ops.mem.init = false;
            }
            
        } else 
        if (ops.mem.state == this.EMBARK) 
        {
            //check if Controller has been claimed
            let room = Game.rooms[ops.target];
            if (room && room.controller && room.controller.my === true) 
            {
                ops.mem.state = this.BUILDING;
                ops.mem.state_started = Game.time;
                ops.mem.timeout = Game.time + 100;
                return;
            }
            
            //state fail - controller has not been claimed
            //todo: maybe check reason - send scout and reevaluate
            if (ops.mem.state_started + this.stateTimeout < Game.time) {
                ops.finished = true;
                let msg = ops.source + ": Claiming of Room " + ops.target + " failed. Aborting!";
                Game.notify(msg);
                console.log(msg);
            }
        } else 
        if (ops.mem.state == this.BUILDING)
        {
            //check if pioneers are sufficient to build spawn
            //otherwise spawn reinforcement
            var need_reinforcement = false;
            let room = Game.rooms[ops.target];
            if (room) 
            {
                //check spawn already built
                let spawns = room.find(
                    FIND_STRUCTURES, 
                    {filter: (s) => s.structureType == STRUCTURE_SPAWN}
                );
                if (spawns.length > 0) {
                    ops.finished = true;
                    return;
                }
                
                //check construction site progress
                var csite_progress = 0;
                var csites = room.find(
                    FIND_MY_CONSTRUCTION_SITES,
                    {filter: (s) => s.structureType == STRUCTURE_SPAWN}
                );
                if (csites.length > 0) {
                    csite_progress = csites[0].progress / csites[0].progressTotal;
                }
                
                //get average living ticks of pioneers
                var total_ticks = 0;
                var avg_ticks = 0;
                var pioneers = room.find(
                    FIND_MY_CREEPS, 
                    {filter: (s) => s.memory.role == 'pioneer'}
                );
                if (pioneers.length > 0) {
                    for (let i=0; i < pioneers.length; i++) {
                        total_ticks += pioneers[i].ticksToLive;
                    }
                    avg_ticks = total_ticks / pioneers.length;
                    if (avg_ticks > ops.mem.max_creep_life) {
                        ops.mem.max_creep_life = avg_ticks;
                    }
                }
                
                var creep_prog = (ops.mem.max_creep_life - avg_ticks) / ops.mem.max_creep_life;
                console.log(ops.source + ": Claim ops: CS:" + Math.round(csite_progress*100) + "% C:" + Math.round(creep_prog*100) + "%");
                
                //construction progress less than life progress of creeps
                if (pioneers.length == 0 || csite_progress < creep_prog && avg_ticks <= 400) {
                    need_reinforcement = true;
                }
            }
            
            //spawn reinforcement
            if (need_reinforcement && !ops.mem.reinforcement) {
                ops.mem.reinforcement = true;
                ops.mem.state_started = Game.time; // restart state
                
                this.spawnPioneerGroup(ops, {target: ops.target});
                console.log(ops.source + ": Claim Ops: Spawning Reinforcement")
                return;
            }
            
            //state fail - spawn reinforcement
            if (ops.mem.state_started + this.stateTimeout < Game.time)
            {
                let msg = ops.source + ": Claim ops cancelled, couls not finish construction!";
                Game.notify(msg);
                console.log(msg);
                ops.finished=true;
                return;
            }
        }
    }, 
    
    
    init: function(ops)
    {
        if (ops.mem.init) return;
        ops.mem.init = true;
        ops.mem.state = this.PREPARE;
        ops.mem.state_started = Game.time;
        ops.mem.skip_timeout = false;
        ops.mem.reinforcement = false;
        ops.mem.max_creep_life = 1000;
        
        
        this.spawnPioneerGroup(ops);
        
        //add timeout
        ops.mem.timeout = Game.time + 50*this.pioneerGroupSize;
    }, 
    
    
    spawnPioneerGroup: function(ops, mem = {})
    {
        var spawns = Game.rooms[ops.source].find(
            FIND_STRUCTURES, 
            {filter: (s) => s.structureType == STRUCTURE_SPAWN}
        );
        if (spawns.length > 0) {
            for (var i=0; i < this.pioneerGroupSize; i++) {
                moduleSpawn.addSpawnList(spawns[0], "pioneer", mem);
            }
        }
    }
};