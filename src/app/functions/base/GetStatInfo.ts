const GetStatInfo = function (permission, passTypeData) {
    let infoCollections: Array<string> = [
        '0010000', // named pipe (fifo)
        '0020000', // character special
        '0040000', // directory
        '0060000', // block special
        '0100000', // regular
        '0120000', // symbolic link
        '0140000', // socket
        '0160000' //whiteout 
    ];
    let whatType = null;
    for (var a = 0; a < infoCollections.length; a++) {
        switch (permission & parseInt(infoCollections[a], 8)) {
            case 16384:
                whatType = 'directory';
                break;
            case 32768:
                whatType = 'file';
                break;
            case 40960:
                whatType = 'link';
                break;
        }
        if (whatType != null) {
            break;
        }
    }
    if (passTypeData != null) {
        if (passTypeData == whatType) {
            return true;
        }
        return false;
    }
    return whatType;
}

export default GetStatInfo;