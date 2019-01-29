/*
   Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)
   
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
qrcode = {};
qrcode.imagedata = null;
qrcode.width = 0;
qrcode.height = 0;
qrcode.qrCodeSymbol = null;
qrcode.debug = false;
qrcode.maxImgSize = 1024 * 1024;
qrcode.sizeOfDataLengthInfo = [
    [10, 9, 8, 8],
    [12, 11, 16, 10],
    [14, 13, 16, 12]
];
qrcode.callback = null;
qrcode.decode = function (imgData) {
    if (arguments.length == 0) {
        var canvas_qr = document.getElementById("qr-canvas");
        var context = canvas_qr.getContext('2d');
        qrcode.width = canvas_qr.width;
        qrcode.height = canvas_qr.height;
        qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);
        var result = jsQR.decodeQRFromImage(qrcode.imagedata.data, qrcode.imagedata.width, qrcode.imagedata.height);
        qrcode.result = qrcode.utf8ToUtf16(result);
        // qrcode.result = qrcode.utf8ToUtf16(qrcode.process(context));
        qrcode.status = 1;
        if (qrcode.callback != null) qrcode.callback(qrcode.result, qrcode.status);
        return qrcode.result;
    } else {
        try {
            qrcode.imagedata = imgData;
        } catch (e) {
            qrcode.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
            qrcode.status = 0;
            if (qrcode.callback != null) qrcode.callback(qrcode.result, qrcode.status);
            return;
        }
        try {
            // qrcode.result = qrcode.utf8ToUtf16(qrcode.process(context));
            var result = jsQR.decodeQRFromImage(qrcode.imagedata.data, qrcode.imagedata.width, qrcode.imagedata.height);
            if (result == "") {
                qrcode.result = "fail decoding QR Code";
                qrcode.status = 0;
            } else {
                qrcode.result = qrcode.utf8ToUtf16(result);
                qrcode.status = 1;
            }
        } catch (e) {
            console.log(e);
            qrcode.result = "error decoding QR Code";
            qrcode.status = 0;
        }
        if (qrcode.callback != null) qrcode.callback(qrcode.result, qrcode.status);
        // }
        // image.src = src;
    }
}
qrcode.isUrl = function (s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}
qrcode.decode_url = function (s) {
    var escaped = "";
    try {
        escaped = escape(s);
    } catch (e) {
        console.log(e);
        escaped = s;
    }
    var ret = "";
    try {
        ret = decodeURIComponent(escaped);
    } catch (e) {
        console.log(e);
        ret = escaped;
    }
    return ret;
}
qrcode.decode_utf8 = function (s) {
    if (qrcode.isUrl(s)) return qrcode.decode_url(s);
    else return s;
}
qrcode.utf8ToUtf16 = function (s) { //将utf-8字符串转码为unicode字符串，要不读取的二维码信息包含中文会乱码
    if (!s) {
        return;
    }
    var i, codes, bytes, ret = [],
        len = s.length;
    for (i = 0; i < len; i++) {
        codes = [];
        codes.push(s.charCodeAt(i));
        if (((codes[0] >> 7) & 0xff) == 0x0) {
            //单字节  0xxxxxxx  
            ret.push(s.charAt(i));
        } else if (((codes[0] >> 5) & 0xff) == 0x6) {
            //双字节  110xxxxx 10xxxxxx  
            codes.push(s.charCodeAt(++i));
            bytes = [];
            bytes.push(codes[0] & 0x1f);
            bytes.push(codes[1] & 0x3f);
            ret.push(String.fromCharCode((bytes[0] << 6) | bytes[1]));
        } else if (((codes[0] >> 4) & 0xff) == 0xe) {
            //三字节  1110xxxx 10xxxxxx 10xxxxxx  
            codes.push(s.charCodeAt(++i));
            codes.push(s.charCodeAt(++i));
            bytes = [];
            bytes.push((codes[0] << 4) | ((codes[1] >> 2) & 0xf));
            bytes.push(((codes[1] & 0x3) << 6) | (codes[2] & 0x3f));
            ret.push(String.fromCharCode((bytes[0] << 8) | bytes[1]));
        }
    }
    return ret.join('');
}
qrcode.process = function (ctx) {
    var start = new Date().getTime();
    var image = qrcode.grayScaleToBitmap(qrcode.grayscale());
    //var image = qrcode.binarize(128);
    if (qrcode.debug) {
        for (var y = 0; y < qrcode.height; y++) {
            for (var x = 0; x < qrcode.width; x++) {
                var point = (x * 4) + (y * qrcode.width * 4);
                qrcode.imagedata.data[point] = image[x + y * qrcode.width] ? 0 : 0;
                qrcode.imagedata.data[point + 1] = image[x + y * qrcode.width] ? 0 : 0;
                qrcode.imagedata.data[point + 2] = image[x + y * qrcode.width] ? 255 : 0;
            }
        }
        ctx.putImageData(qrcode.imagedata, 0, 0);
    }
    //var finderPatternInfo = new FinderPatternFinder().findFinderPattern(image);
    var detector = new Detector(image);
    var qRCodeMatrix = detector.detect();
    /*for (var y = 0; y < qRCodeMatrix.bits.Height; y++)
    {
        for (var x = 0; x < qRCodeMatrix.bits.Width; x++)
        {
            var point = (x * 4*2) + (y*2 * qrcode.width * 4);
            qrcode.imagedata.data[point] = qRCodeMatrix.bits.get_Renamed(x,y)?0:0;
            qrcode.imagedata.data[point+1] = qRCodeMatrix.bits.get_Renamed(x,y)?0:0;
            qrcode.imagedata.data[point+2] = qRCodeMatrix.bits.get_Renamed(x,y)?255:0;
        }
    }*/
    if (qrcode.debug) ctx.putImageData(qrcode.imagedata, 0, 0);
    var reader = Decoder.decode(qRCodeMatrix.bits);
    var data = reader.DataByte;
    var str = "";
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) str += String.fromCharCode(data[i][j]);
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log(time);
    return qrcode.decode_utf8(str);
    //alert("Time:" + time + " Code: "+str);
}
qrcode.getPixel = function (x, y) {
    if (qrcode.width < x) {
        throw "point error";
    }
    if (qrcode.height < y) {
        throw "point error";
    }
    point = (x * 4) + (y * qrcode.width * 4);
    p = (qrcode.imagedata.data[point] * 33 + qrcode.imagedata.data[point + 1] * 34 + qrcode.imagedata.data[point + 2] * 33) / 100;
    return p;
}
qrcode.binarize = function (th) {
    var ret = new Array(qrcode.width * qrcode.height);
    for (var y = 0; y < qrcode.height; y++) {
        for (var x = 0; x < qrcode.width; x++) {
            var gray = qrcode.getPixel(x, y);
            ret[x + y * qrcode.width] = gray <= th ? true : false;
        }
    }
    return ret;
}
qrcode.getMiddleBrightnessPerArea = function (image) {
    var numSqrtArea = 4;
    //obtain middle brightness((min + max) / 2) per area
    var areaWidth = Math.floor(qrcode.width / numSqrtArea);
    var areaHeight = Math.floor(qrcode.height / numSqrtArea);
    var minmax = new Array(numSqrtArea);
    for (var i = 0; i < numSqrtArea; i++) {
        minmax[i] = new Array(numSqrtArea);
        for (var i2 = 0; i2 < numSqrtArea; i2++) {
            minmax[i][i2] = new Array(0, 0);
        }
    }
    for (var ay = 0; ay < numSqrtArea; ay++) {
        for (var ax = 0; ax < numSqrtArea; ax++) {
            minmax[ax][ay][0] = 0xFF;
            for (var dy = 0; dy < areaHeight; dy++) {
                for (var dx = 0; dx < areaWidth; dx++) {
                    var target = image[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width];
                    if (target < minmax[ax][ay][0]) minmax[ax][ay][0] = target;
                    if (target > minmax[ax][ay][1]) minmax[ax][ay][1] = target;
                }
            }
            //minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
        }
    }
    var middle = new Array(numSqrtArea);
    for (var i3 = 0; i3 < numSqrtArea; i3++) {
        middle[i3] = new Array(numSqrtArea);
    }
    for (var ay = 0; ay < numSqrtArea; ay++) {
        for (var ax = 0; ax < numSqrtArea; ax++) {
            middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
            //Console.out.print(middle[ax][ay] + ",");
        }
        //Console.out.println("");
    }
    //Console.out.println("");
    return middle;
}
qrcode.grayScaleToBitmap = function (grayScale) {
    var middle = qrcode.getMiddleBrightnessPerArea(grayScale);
    var sqrtNumArea = middle.length;
    var areaWidth = Math.floor(qrcode.width / sqrtNumArea);
    var areaHeight = Math.floor(qrcode.height / sqrtNumArea);
    var bitmap = new Array(qrcode.height * qrcode.width);
    for (var ay = 0; ay < sqrtNumArea; ay++) {
        for (var ax = 0; ax < sqrtNumArea; ax++) {
            for (var dy = 0; dy < areaHeight; dy++) {
                for (var dx = 0; dx < areaWidth; dx++) {
                    bitmap[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] = (grayScale[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] < middle[ax][ay]) ? true : false;
                }
            }
        }
    }
    return bitmap;
}
qrcode.grayscale = function () {
    var ret = new Array(qrcode.width * qrcode.height);
    for (var y = 0; y < qrcode.height; y++) {
        for (var x = 0; x < qrcode.width; x++) {
            var gray = qrcode.getPixel(x, y);
            ret[x + y * qrcode.width] = gray;
        }
    }
    return ret;
}

function URShift(number, bits) {
    if (number >= 0) return number >> bits;
    else return (number >> bits) + (2 << ~bits);
}
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
