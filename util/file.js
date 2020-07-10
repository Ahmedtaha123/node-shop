const fs = require('fs');

const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            let newFilePath;
            if(filePath.charAt(0) === '/'){
                newFilePath = filePath.substr(1);
            } else{
                newFilePath = filePath;
            }
            fs.unlink(newFilePath, (err) => {
                if(err){
                    throw (err);
                }
            });
        }
    } catch(err) {
    console.error(err)
    }
    
};

exports.deleteFile = deleteFile;