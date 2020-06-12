module.exports = {
    run: function(room) {
        if (!room.memory.ltasks) {
            room.memory.ltasks = {};
        }
        room.memory.ltasks_upd = true;
        
        //ltasks = {prio, type:, src:, vol:, acc:, utx:, rec:, res:}
        //prio, type, source, total volume, accepted volume, under transport volume, [receiver], [resource type]
    }, 
    
    updateTaskList: function(room)
    {
        this.genLootTasks(room);
        this.genSpawnDistributionTask(room);
    }, 
    
    //generates hauling tasks for transporting loot
    genLootTasks: function(room)
    {
        //todo: if room is attacked, skip looting
        if (room.memory.attacked_time + 30 > Game.time) return;
        
        //get loot sources
        var res = room.find(FIND_DROPPED_RESOURCES);
        var ts = room.find(FIND_TOMBSTONES);
        var ru = room.find(FIND_RUINS);
        
        var targets = [].concat(res, ts, ru);
        
        for (var i=0; i < targets.length; i++)
        {
            var amount = targets[i].amount || targets[i].store.getUsedCapacity();
            
            if (amount > 10)
            {
                var task = {};
                task.id = "";
                task.prio = 6;
                task.type = "loot";
                task.src = targets[i].id;
                task.vol = amount;
                task.acc = 0;
                task.utx = 0;
                task.rec = null;
                task.res = null;
                
                this.insertOrUpdate(room, task);
            }
        }
    }, 
    
    //carries energy from Containers and Storages to Spawn
    genSpawnDistributionTask: function(room)
    {
        //calc energy need of towers (and labs?)
        var energyNeed = room.find(FIND_MY_STRUCTURES, 
            {
                filter: (s) => 
                { 
                    return s.structureType == STRUCTURE_TOWER && 
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 50;
                }
            }
        );
        var structEnergyNeed = 0;
        for (let i=0; i < energyNeed.length; i++)
        {
            structEnergyNeed += energyNeed[i].store.getFreeCapacity(RESOURCE_ENERGY);
        }
        
        //calc total energy needed
        var energyNeeded = room.energyCapacityAvailable - room.energyAvailable + structEnergyNeed;
        var source = false;
        
        //get base containers containing energy
        var containers = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER && 
            s.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
            s.store[RESOURCE_ENERGY] > 0;
        }});
        containers = _.sortBy(containers, (s)=>-s.store[RESOURCE_ENERGY]);
        
        //get energy of fullest container
        var energyAvbl = 0;
        if (containers.length > 0)
        {
            energyAvbl = containers[0].store[RESOURCE_ENERGY];
        }
        
        if (room.storage && 
            room.storage.store[RESOURCE_ENERGY] > energyAvbl)
        {
            source = room.storage;
            energyAvbl = room.storage.store[RESOURCE_ENERGY];
        } else if (containers.length > 0) {
            source = containers[0];
        }
        
        if (source && energyNeeded > 0) {
            
            var energyForTransport = Math.min(energyNeeded, energyAvbl);
             
            var task = {};
            task.id = "";
            task.prio = 5;
            task.type = "s";
            task.src = source.id;
            task.vol = energyForTransport;
            task.acc = 0;
            task.rec = null;
            task.res = RESOURCE_ENERGY;
            
            this.insertOrUpdate(room, task, true);
        } else {
            this.removeTaskGroup(room, "s");
        }
    },
    
    genTerminalFilling: function(room) {
        var structures = room.find(
            FIND_STRUCTURES, 
            {filter: (s) => s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE}
        );
        
        for (var i in structures) {
            var s = structures[i];
            
            //mining container - skip
            var sources = s.pos.findInRange(FIND_SOURCES, 2);
            var minerals = s.pos.findInRange(FIND_MINERALS, 2);
            if (s.structureType == STRUCTURE_CONTAINER && (sources.length > 0 || minerals.length > 0)) {
                continue;
            }
            
            //get resources
            var res = baseCreep.getStoredResourceTypes(s.store);
            for (var j in res) {
                if (res[j] == RESOURCE_ENERGY) continue;
                var amt = s.store[res[j]];
                this.addTransportTask(room, s.id, room.terminal.id, amt, res[j]);
            }
        }
    }, 
    
    //insert or update task
    //if ignoreSource=true, only compares task type
    insertOrUpdate: function(room, task, ignoreSource=false, force_new=false)
    {
        var id = _.find(
            room.memory.ltasks, 
            (s) => { 
                return (s.src == task.src || ignoreSource) && 
                    s.type == task.type && 
                    (!task.rec || s.rec == task.rec) &&
                    (!task.res || s.res == task.res); 
        });
        
        if (id && !force_new)
        {
            //update
            var accepted = room.memory.ltasks[index].acc;
            room.memory.ltasks[index] = task;
            room.memory.ltasks[index].id = id;
            room.memory.ltasks[index].acc = accepted;
        } else {
            //find unique id
            do {
                id = baseCreep.getRandomString(5);
            } while (room.memory.ltasks[id]);
            
            //insert
            task.id = id;
            room.memory.ltasks[id] = task;
        }
    }, 
    
    addTransportTask: function(room, source, receiver, amount, resource, prio=5, type='t', force_new = false)
    {
        if (source && source.id) {
            source = source.id;
        }
        
        if (receiver && receiver.id) {
            receiver = receiver.id;
        }
        
        var task = {
            id: "",
            prio: prio,
            type: type,
            src: source,
            vol: amount,
            acc: 0,
            rec: receiver,
            res: resource
        };
        moduleLogistics.insertOrUpdate(room, task, false, force_new);
        
        /*if (task.type == "l") {
            console.log(room.name + "/" + Game.time + ": l task inserted");
        }*/
    }, 
    
    removeTaskGroup: function(room, taskgroup)
    {
        room.memory.ltasks = _.remove(room.memory.ltasks, (s) => { return s.type != taskgroup; });
    },
    
    
    sortTaskList: function(room)
    {
        room.memory.ltasks = _.sortBy(room.memory.ltasks, (s) => -(s.prio*1000000+s.vol-s.acc));
    },
    
    
    getNewTasks: function(room, capacity)
    {
        if (room.memory.ltasks_upd) {
            this.updateTaskList(room);
            room.memory.ltasks_upd = false;
        }
        this.sortTaskList(room);
        
        var id = _.find(room.memory.ltasks, (s) => { return s.vol > s.acc;});
        
        if (id) {
            room.memory.ltasks[id].acc += capacity;
            return [ id ];
        }
        
        return null;
    }, 
    
    getTask: function(room, taskid)
    {
        return room.memory.ltasks[taskid];
    }, 
    
    markPickup: function(room, taskid, volume)
    {
        var id = taskid;
        
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].acc -= volume;
            room.memory.ltasks[id].utx += volume;
            if (room.memory.ltasks[id].acc < 0) {
                room.memory.ltasks[id].acc = 0;
            }
        }
    }, 
    
    markDropoff: function(room, taskid, volume) {
        var id = taskid;
        
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].utx -= volume;
            room.memory.ltasks[id].vol -= volume;
            if (room.memory.ltasks[id].utx < 0) {
                room.memory.ltasks[id].utx = 0;
            }
            if (room.memory.ltasks[id].vol <= 0) {
                delete room.memory.ltasks[id];
            }
        }
    }, 
    
    deleteTask: function(room, taskid)
    {
        delete room.memory.ltasks[taskid];
    }
    
    
};