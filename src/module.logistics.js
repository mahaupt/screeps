module.exports = {
    run: function(room) {
        if (!room.memory.ltasks) {
            room.memory.ltasks = [];
        }
        room.memory.ltasks_upd = true;
        
        //ltasks = {prio, type:, src:, vol:, acc:, [rec:, res:]}
        //prio, type, source, volume, accepted volume, [receiver], [resource type]
        //this.updateTaskList(room);
        //this.sortTaskList(room);
    }, 
    
    updateTaskList: function(room)
    {
        //this.removeInvalidTasks(room);
        this.genLootTasks(room);
        //this.genLinkTask(room);
        //this.genContainerTasks(room);
        this.genSpawnDistributionTask(room);
    }, 
    
    removeInvalidTasks: function(room)
    {
        //also remove inactive MC and Links
        _.remove(room.memory.ltasks, (s) => { 
            return ((s.type == 'mc' || s.type == 'l') && s.acc == 0) || 
                Game.getObjectById(s.src) == null; });
    }, 
    
    //generates hauling tasks for transporting loot
    genLootTasks: function(room)
    {
        //todo: if room is attacked, do careful lotting
        //if (room.memory.attacked) return;
        
        //get loot sources
        var res = room.find(FIND_DROPPED_RESOURCES);
        var ts = room.find(FIND_TOMBSTONES);
        var ru = room.find(FIND_RUINS);
        
        var targets = [].concat(res, ts, ru);
        
        for (var i=0; i < targets.length; i++)
        {
            var amount = targets[i].amount || targets[i].store.getUsedCapacity();
            if (amount < 10) continue;
            
            if (amount > 0)
            {
                var task = {};
                task.prio = 6;
                task.type = "loot";
                task.src = targets[i].id;
                task.vol = amount;
                task.acc = 0;
                
                this.insertOrUpdate(room, task);
            }
        }
    }, 
    
    //generates hauling tasks for emtying base links
    genLinkTask: function(room)
    {
        //find base links
        var links = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_LINK &&
            s.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
            s.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }});
        
        for (var i=0; i<links.length; i++)
        {
            var task = {};
            task.prio = 7;
            task.type = "l";
            task.src = links[i].id;
            task.vol = links[i].store.getUsedCapacity(RESOURCE_ENERGY);
            task.acc = 0;
            task.res = RESOURCE_ENERGY;
            
            this.insertOrUpdate(room, task);
        }
    }, 
    
    //
    genContainerTasks: function(room)
    {
        //find mining containers without links
        var mcontainers = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER && 
                (s.pos.findInRange(FIND_SOURCES, 2).length>0 || 
                s.pos.findInRange(FIND_MINERALS, 2).length>0) && 
                s.store.getUsedCapacity() >= s.store.getCapacity()*0.1 && 
                s.pos.findInRange(FIND_STRUCTURES, 2, {filter: (t) => t.structureType == STRUCTURE_LINK}).length == 0;
        }});
        
        for (var i=0; i < mcontainers.length; i++)
        {
            var task = {};
            task.prio = 5;
            task.type = "mc";
            task.src = mcontainers[i].id;
            task.vol = mcontainers[i].store.getUsedCapacity();
            task.acc = 0;
            
            this.insertOrUpdate(room, task);
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
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 10;
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
        
        if (source) {
            
            var energyForTransport = Math.min(energyNeeded, energyAvbl);
             
            var task = {};
            task.prio = 5;
            task.type = "s";
            task.src = source.id;
            task.vol = energyForTransport;
            task.acc = 0;
            task.res = RESOURCE_ENERGY;
            
            this.insertOrUpdate(room, task, true);
        } else {
            this.removeTaskGroup(room, "s");
        }
    },
    
    //insert or update task
    //if ignoreSource=true, only compares task type
    insertOrUpdate: function(room, task, ignoreSource=false)
    {
        var index = _.findIndex(
            room.memory.ltasks, 
            (s) => { 
                return (s.src == task.src || ignoreSource) && 
                    s.type == task.type && 
                    (!task.rec || s.rec == task.rec); 
        });
        
        if (index >= 0)
        {
            //update
            var accepted = room.memory.ltasks[index].acc;
            room.memory.ltasks[index] = task;
            room.memory.ltasks[index].acc = accepted;
        } else {
            //insert
            room.memory.ltasks.push(task);
        }
    }, 
    
    addTransportTask: function(room, source, receiver, amount, resource, prio=4, type='t')
    {
        if (source && source.id) {
            source = source.id;
        }
        
        if (receiver && receiver.id) {
            receiver = receiver.id;
        }
        
        var task = {
            prio: prio,
            type: type,
            src: source,
            vol: amount,
            acc: 0,
            rec: receiver,
            res: resource
        };
        moduleLogistics.insertOrUpdate(room, task);
    }, 
    
    removeTaskGroup: function(room, taskgroup)
    {
        room.memory.ltasks = _.remove(room.memory.ltasks, (s) => { return s.type != taskgroup; });
    },
    
    
    sortTaskList: function(room)
    {
        room.memory.ltasks = _.sortBy(room.memory.ltasks, (s) => -(s.prio*1000000+s.vol-s.acc));
    },
    
    
    getTask: function(room, capacity)
    {
        if (room.memory.ltasks_upd) {
            this.updateTaskList(room);
            room.memory.ltasks_upd = false;
        }
        this.sortTaskList(room);
        
        var index = _.findIndex(room.memory.ltasks, (s) => { return s.vol > s.acc;});
        
        if (index >= 0) {
            room.memory.ltasks[index].acc += capacity;
            return room.memory.ltasks[index];
        }
        
        return null;
    }, 
    
    dropTask: function(room, task, capacity, drawnCapacity=0)
    {
        var index = _.findIndex(room.memory.ltasks, (s) => { return s.src == task.src && s.type == task.type; });
        
        if (index >= 0)
        {
            room.memory.ltasks[index].acc -= capacity;
            room.memory.ltasks[index].vol -= drawnCapacity;
            if (room.memory.ltasks[index].acc < 0) {
                room.memory.ltasks[index].acc = 0;
            }
            if (room.memory.ltasks[index].vol <= 0) 
            {
                //no more to transport - delete task
                room.memory.ltasks.splice(index, 1);
            }
        }
    }, 
    
    deleteTask: function(room, task)
    {
        room.memory.ltasks = _.remove(room.memory.ltasks, (s) => { 
            return !(s.src == task.src && s.type == task.type && s.rec == task.rec); 
        });
    }
    
    
};