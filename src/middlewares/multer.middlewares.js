import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") // Specify the directory for storing files
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname) // Set a unique name or in this case original name of the file for the uploaded file
    }
  })
  
export const upload = multer({ 
    storage, 
})
