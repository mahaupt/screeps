module.exports = {
    run: function(room) {
        if (!room.memory.ltasks) {
            room.memory.ltasks = {};
        }
        room.memory.ltasks_upd = true;
        
        //ltasks = {prio, type:, src:, vol:, acc:, utx:, rec:, res:}
        //prio, type, source, total volume, accepted volume, under transport volume, [receiver], [resource type]
        // prio: 5 norm - higher better prio
        
        room.visual.text("Transport Tasks", 1, 1, {align: 'left'});
        var i = 0;
        for (var id in room.memory.ltasks) {
            var task = room.memory.ltasks[id];
            i++;
            
            room.visual.text(task.id, 1, 1+i, {align: 'left'});
            room.visual.text(task.type, 5, 1+i, {align: 'left'});
            room.visual.text(task.vol, 7, 1+i, {align: 'left'});
            room.visual.text(task.res, 9, 1+i, {align: 'left'});
            room.visual.text(task.acc, 13, 1+i, {align: 'left'});
            room.visual.text(task.utx, 15, 1+i, {align: 'left'});
        }
    }, 
    
    updateTaskList: function(room)
    {
        // remove outdated tasks
        // todo: check if this causes issues
        for (var id in room.memory.ltasks) {
            // source gone
            if (!Game.getObjectById(room.memory.ltasks[id].src)) {
                if (room.memory.ltasks[id].utx > 0) {
                    room.memory.ltasks[id].vol = room.memory.ltasks[id].utx;
                } else {
                    this.deleteTask(room, id);
                }
            }
        }

        this.genLootTasks(room);
        this.genSpawnDistributionTask(room);
    }, 
    
    //generates hauling tasks for transporting loot
    genLootTasks: function(room)
    {
        var res = room.find(FIND_DROPPED_RESOURCES);
        var ts = room.find(FIND_TOMBSTONES);
        var ru = room.find(FIND_RUINS);

        //if room is attacked, skip looting tombstones and ruins
        if (room.memory.attacked_time + 30 > Game.time) {
            ts = [];
            ru = [];
        }
        
        var targets = [].concat(res, ts, ru);
        for (var i=0; i < targets.length; i++)
        {
            var resources = [];
            if (targets[i] instanceof Resource) {
                resources = [ targets[i].resourceType ];
            } else {
                resources = baseCreep.getStoredResourceTypes(targets[i].store);
            }
            
            for (var res_type of resources) 
            {
                var amount = targets[i].amount || targets[i].store[res_type];
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
                    task.res = res_type;
                    
                    this.insertOrUpdate(room, task);
                }
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
            task.prio = 6;
            task.type = "s";
            task.src = source.id;
            task.vol = energyForTransport;
            task.acc = 0;
            task.utx = 0;
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
                let amt = s.store[res[j]];
                this.addTransportTask(room, s.id, room.terminal.id, amt, res[j]);
            }
        }
        
        //put excess energy to storage
        if (room.terminal.store[RESOURCE_ENERGY] > 30000) {
            let amt = room.terminal.store[RESOURCE_ENERGY] - 30000;
            this.addTransportTask(room, room.terminal.id, room.storage.id, amt, RESOURCE_ENERGY);
        }
    }, 
    
    //insert or update task
    //if ignoreSource=true, only compares task type
    insertOrUpdate: function(room, task, ignoreSource=false, force_new=false)
    {
        var id = _.findKey(
            room.memory.ltasks, 
            (s) => { 
                return (s.src == task.src || ignoreSource) && 
                    s.type == task.type && 
                    s.res == task.res && 
                    (!task.rec || s.rec == task.rec); 
        });
        
        if (id && !force_new)
        {
            //update
            var accepted = room.memory.ltasks[id].acc;
            var utx = room.memory.ltasks[id].utx;
            
            room.memory.ltasks[id] = task;
            room.memory.ltasks[id].id = id;
            room.memory.ltasks[id].acc = accepted;
            room.memory.ltasks[id].utx = utx;
            room.memory.ltasks[id].created_at = Game.time;
            
            //outgoing tasks
            if (task.type == "l" || task.type == "loot" || task.type == "mc") {
                room.memory.ltasks[id].vol += utx;
            }
            
        } else {
            //find unique id
            do {
                var time = Game.time - Math.floor(Game.time/1000)*1000;;
                id = time + baseCreep.getRandomString(3);
            } while (room.memory.ltasks[id]);
            
            //insert
            task.id = id;
            room.memory.ltasks[id] = task;
            room.memory.ltasks[id].created_at = Game.time;
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
            utx: 0,
            rec: receiver,
            res: resource
        };
        moduleLogistics.insertOrUpdate(room, task, false, force_new);
    }, 
    
    removeTaskGroup: function(room, taskgroup)
    {
        var tasks = _.filter(room.memory.ltasks, (s) => { return s.type == taskgroup; });
        for (var t of tasks) {
            delete room.memory.ltasks[t.id];
        }
    },
    
    
    getNewTasks: function(room, capacity, filter=(task)=>true)
    {
        if (!room) return [];
        if (!capacity || capacity <= 0) {
            // TODO: check if this is a problem or just sim bug
            console.log(room.name + " logistics: invalid capacity: " + capacity);
            return [];
        }
        if (room.memory.ltasks_upd) {
            this.updateTaskList(room);
            room.memory.ltasks_upd = false;
        }
        
        // sort task by volume and priority
        var tasks = _.sortBy(room.memory.ltasks, (s) => -s.vol+s.acc+s.utx-s.prio*30000);
        
        // get task with open items and filter
        var task = _.find(tasks, (s) => { return s.vol-s.acc-s.utx > 0 && filter(s);});
        //var task = _.find(tasks, (s) => { return s.acc== 0 && s.utx == 0;});
        
        if (task) {
            var task_add = 0;
            
            //s and mc always try to make full
            if (task.type == "mc" || task.type == "s") {
                task_add = 10000; // always take maximum amount
            }
            var amount = Math.min(capacity, task.vol-task.acc-task.utx+task_add);
            amount = Math.max(amount, 0);
            
            room.memory.ltasks[task.id].acc += amount;
            return [ {id: task.id, vol: amount, utx: 0} ];
        }
        
        return [];
    }, 
    
    getTask: function(room, taskid)
    {
        return room.memory.ltasks[taskid];
    }, 
    
    markPickup: function(room, taskid, acc, utx)
    {
        var id = taskid;
        
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].acc -= acc;
            room.memory.ltasks[id].utx += utx;
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
    
    //cancel accepted tasks
    markCancel: function(room, taskid, acc)
    {
        var id = taskid;
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].acc -= acc;
            if (room.memory.ltasks[id].acc < 0) {
                room.memory.ltasks[id].acc = 0;
            }
        }
    }, 
    
    //abort task while transporting
    markAbort: function(room, taskid, volume)
    {
        var id = taskid;
        
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].utx -= volume;
            if (room.memory.ltasks[id].utx < 0) {
                room.memory.ltasks[id].utx = 0;
            }
            
            //mc and l have less volume
            var type = room.memory.ltasks[id].type;
            if (type == "mc" || type == "l") {
                room.memory.ltasks[id].vol -= volume;
                if (room.memory.ltasks[id].vol <= 0) {
                    delete room.memory.ltasks[id];
                }
            }
        }
    }, 
    
    setVolume: function(room, taskid, volume) {
        var id = taskid;
        
        if (room.memory.ltasks[id])
        {
            room.memory.ltasks[id].vol = volume;
        }
    }, 
    
    deleteTask: function(room, taskid)
    {
        delete room.memory.ltasks[taskid];
    }
    
    
};