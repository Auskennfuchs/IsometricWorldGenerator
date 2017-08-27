var HeightMap = function () {

    var heightData = [];
    var mapSize = 0;

    var mapScale = { x: 2, y: 3, z: 2 };

    function _generateHeight(width, height) {
        var data = [], perlin = new ImprovedNoise(),
            size = width * height, quality = 2, z = Math.random() * 255;
        for (var j = 0; j < 4; j++) {
            if (j === 0) for (var i = 0; i < size; i++) data[i] = 0;
            for (var i = 0; i < size; i++) {
                var x = i % width, y = (i / width) | 0;
                data[i] += perlin.noise(x / quality, y / quality, z) * quality;
            }
            quality *= 4;
        }
        return data;
    }

    function _generateCurtainX(useZ, geometry) {
        var lowerCurtain = [], highCurtain = [], heights = [];

        for (var vx = 0; vx < mapSize; vx++) {
            var x = useZ ? mapSize - 1 - vx : vx;
            var pixelPos = x + (useZ * (mapSize - 1)) * mapSize;
            var heightVal = heightData[pixelPos];
            heights.push(heightVal);
            var vert1 = new THREE.Vector3(x - mapSize / 2.0, heightVal, useZ * (mapSize - 1) - mapSize / 2.0);
            var vert2 = new THREE.Vector3(x - mapSize / 2.0, -128.0, useZ * (mapSize - 1) - mapSize / 2.0);
            vert1.divide(mapScale);
            vert2.divide(mapScale);
            highCurtain.push(vert1);
            lowerCurtain.push(vert2);
        }
        _genCurtainFaces(lowerCurtain, highCurtain, heights, geometry, mapSize);
    }

    function _generateCurtainZ(useX, geometry) {
        var lowerCurtain = [], highCurtain = [], heights = [];

        for (var vz = 0; vz < mapSize; vz++) {
            var z = useX ? vz : mapSize - 1 - vz;
            var pixelPos = useX * (mapSize - 1) + z * mapSize;
            var heightVal = heightData[pixelPos];
            heights.push(heightVal);
            var vert1 = new THREE.Vector3(useX * (mapSize - 1) - mapSize / 2.0, heightVal, z - mapSize / 2.0);
            var vert2 = new THREE.Vector3(useX * (mapSize - 1) - mapSize / 2.0, -128.0, z - mapSize / 2.0);
            vert1.divide(mapScale);
            vert2.divide(mapScale);
            highCurtain.push(vert1);
            lowerCurtain.push(vert2);
        }
        _genCurtainFaces(lowerCurtain, highCurtain, heights, geometry, mapSize);
    }

    function _genCurtainFaces(lowerCurtain, highCurtain, heights, geometry, size) {
        var faceStart = geometry.vertices.length;
        geometry.vertices = geometry.vertices.concat(lowerCurtain, highCurtain);
        for (var x = 0; x < size - 1; x++) {
            var f1a = faceStart + (x + 1) + 1 * size,
                f1b = faceStart + (x + 1) + 0 * size,
                f1c = faceStart + (x + 0) + 0 * size,
                f2a = faceStart + (x + 0) + 1 * size,
                f2b = faceStart + (x + 1) + 1 * size,
                f2c = faceStart + (x + 0) + 0 * size;
            var f1 = new THREE.Face3(f1a, f1b, f1c);
            var f2 = new THREE.Face3(f2a, f2b, f2c);
            geometry.faces.push(f1, f2);
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((heights[x + 1] + 128.0) / 255.0, 1.0),
                new THREE.Vector2(0.0, 0.0),
                new THREE.Vector2(0.0, 0.0),
            ]);
            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((heights[x] + 128.0) / 255.0, 1.0),
                new THREE.Vector2((heights[x + 1] + 128.0) / 255.0, 1.0),
                new THREE.Vector2(0.0, 0.0),
            ]);
        }
    }

    function _genCurtainBottom(geometry) {
        var verts = [
            new THREE.Vector3(mapSize / 2.0, -128.0, - mapSize / 2.0),
            new THREE.Vector3(- mapSize / 2.0, -128.0, - mapSize / 2.0),
            new THREE.Vector3(mapSize / 2.0, -128.0, mapSize / 2.0),
            new THREE.Vector3(- mapSize / 2.0, -128.0, mapSize / 2.0),
        ];
        verts.map(v=>v.divide(mapScale));
        _genCurtainFaces(verts, [], [-128.0, -128.0], geometry, 2);
    }

    return {
        createCanvasTexture: function (size, canvasId) {
            heightData = _generateHeight(size, size);
            mapSize = size;
            var canvas = document.getElementById(canvasId);
            var ctx = canvas.getContext('2d');
            var p = ctx.createImageData(size, size);
            for (var y = 0; y < size; y++) {
                for (var x = 0; x < size; x++) {
                    var pixelPos = x + y * size;
                    var heightVal = (heightData[pixelPos] / 2 + 50) / 100.0 * 255;
                    p.data[pixelPos * 4 + 0] = heightVal;
                    p.data[pixelPos * 4 + 1] = heightVal;
                    p.data[pixelPos * 4 + 2] = heightVal;
                    p.data[pixelPos * 4 + 3] = 255;
                }
            }
            ctx.putImageData(p, 0, 0);
        },

        createMesh: function () {
            var geometry = new THREE.Geometry();
            for (var z = 0; z < mapSize; z++) {
                for (var x = 0; x < mapSize; x++) {
                    var pixelPos = x + z * mapSize;
                    var heightVal = heightData[pixelPos];
                    var vert = new THREE.Vector3(x - mapSize / 2.0, heightVal, z - mapSize / 2.0);
                    vert.divide(mapScale);
                    geometry.vertices.push(vert);
                }
            }

            var uvCount = 0;
            geometry.faceVertexUvs = [[]];
            for (var y = 0; y < mapSize - 1; y++) {
                for (var x = 0; x < mapSize - 1; x++) {
                    var f1a = (x + 1) + (y + 1) * mapSize,
                        f1b = (x + 1) + y * mapSize,
                        f1c = (x + 0) + y * mapSize,
                        f2a = (x + 0) + (y + 1) * mapSize,
                        f2b = (x + 1) + (y + 1) * mapSize,
                        f2c = (x + 0) + y * mapSize;
                    var f1 = new THREE.Face3(f1a, f1b, f1c);
                    var f2 = new THREE.Face3(f2a, f2b, f2c);
                    geometry.faces.push(f1, f2);
                    geometry.faceVertexUvs[0].push([
                        new THREE.Vector2((heightData[f1a] + 128.0) / 255.0, 1.0),
                        new THREE.Vector2((heightData[f1b] + 128.0) / 255.0, 0.0),
                        new THREE.Vector2((heightData[f1c] + 128.0) / 255.0, 0.0)
                    ]);
                    geometry.faceVertexUvs[0].push([
                        new THREE.Vector2((heightData[f2a] + 128.0) / 255.0, 1.0),
                        new THREE.Vector2((heightData[f2b] + 128.0) / 255.0, 1.0),
                        new THREE.Vector2((heightData[f2c] + 128.0) / 255.0, 0.0)
                    ]);
                }
            }
            _generateCurtainX(0, geometry);
            _generateCurtainX(1, geometry);
            _generateCurtainZ(0, geometry);
            _generateCurtainZ(1, geometry);
            _genCurtainBottom(geometry);

            geometry.computeVertexNormals(true);
            return geometry;
        },

        createCurtain: function () {
            var geometry = new THREE.Geometry();

            _generateCurtainX(0, geometry);
            _generateCurtainX(1, geometry);
            _generateCurtainZ(0, geometry);
            _generateCurtainZ(1, geometry);
            _genCurtainBottom(geometry);

            return geometry;
        }
    }
}
