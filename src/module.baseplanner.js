const BASE_SIZE = 7;
class BasePlanner {
    getBaseCenter(roomName) {
        let distanceTransform = this.distanceTransform(roomName);
        let center = new RoomPosition(25, 25, roomName);
        let bestPos = undefined;
        let bestValue = -99999;

        for (let x = 0; x < 50; ++x) {
            for (let y = 0; y < 50; ++y) {
                let value = distanceTransform.get(x, y);
                if (value < BASE_SIZE) continue;

                // source distance
                let sources = Game.rooms[roomName].sources;
                let sdistance = 0
                for (let source of sources) {
                    sdistance += source.pos.getRangeTo(x, y);
                }
                value -= sdistance/sources.length;

                // controller distance
                let controller = Game.rooms[roomName].controller;
                value -= controller.pos.getRangeTo(x, y);

                // center pos
                value -= center.getRangeTo(x, y);

                if (value > bestValue) {
                    bestValue = value;
                    bestPos = new RoomPosition(x, y, roomName);
                }
            }
        }

        return {pos: bestPos, points: bestValue};
    }

    distanceTransform(roomName) {
        let terrain = Game.map.getRoomTerrain(roomName);
        let topDownPass = new PathFinder.CostMatrix();
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) == TERRAIN_MASK_WALL) {
                    topDownPass.set(x, y, 0);
                }
                else {
                    topDownPass.set(x, y,
                        Math.min(topDownPass.get(x-1, y-1), topDownPass.get(x, y-1),
                            topDownPass.get(x+1, y-1), topDownPass.get(x-1, y)) + 1);
                }
            }
        }
    
        for (let y = 49; y >= 0; --y) {
            for (let x = 49; x >= 0; --x) {
                let value = Math.min(topDownPass.get(x, y),
                        topDownPass.get(x+1, y+1) + 1, topDownPass.get(x, y+1) + 1,
                        topDownPass.get(x-1, y+1) + 1, topDownPass.get(x+1, y) + 1);
                topDownPass.set(x, y, value);
            }
        }
        
        return topDownPass;
    }
}

module.exports = new BasePlanner();