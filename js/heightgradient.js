var HeightGradient = function () {
    function lerp(pos,a,b) {
        var rA=a.col>>16 & 0xff;
        var gA=a.col>>8 & 0xff;
        var bA=a.col & 0xff;

        var rB=b.col>>16 & 0xff;
        var gB=b.col>>8 & 0xff;
        var bB=b.col & 0xff;

        var amount = pos/b.pos*1.0;

        var r = Math.round(rA + amount * (rB - rA));
        var g = Math.round(gA + amount * (gB - gA));
        var b = Math.round(bA + amount * (bB - bA));

        return (r&0xff)<<16|(g&0xff)<<8|(b&0xff);
    }
    return {
        getGradient: function () {
            var canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 1;
            var gradVals = [
                { col: 0x202020, pos: 0 },
                { col: 0x646464, pos: 50 },
                { col: 0xfcfcc0, pos: 70 },
                { col: 0x50683c, pos: 128 },
                { col: 0xb4cc7c, pos: 180 },
                { col: 0xe8e8e8, pos: 255 },
            ];
            var ctx = canvas.getContext('2d');
            var p = ctx.createImageData(canvas.width, canvas.height);
            for(var i=0;i<gradVals.length-1;i++) {
                var gradA = gradVals[i];
                var gradB = gradVals[i+1];
                for(j=gradA.pos;j<=gradB.pos;j++) {
                    var col = lerp(j,gradA,gradB);
                    p.data[j*4+0]=col>>16 & 0xff;
                    p.data[j*4+1]=col>>8 & 0xff;
                    p.data[j*4+2]=col & 0xff;
                    p.data[j*4+3]=255;
                }
            }
            ctx.putImageData(p, 0, 0);
            return canvas;
        }
    }
}