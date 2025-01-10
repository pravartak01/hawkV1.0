import dotenv from "dotenv"
dotenv.config({path: "../../.env"})

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

cloudinary.config({
    cloudinary_url: "cloudinary://358791273669396:s9bQRAWzVjcKUOf8tIIw3TVhSlg@dawppjhpb"
})

// console.log(process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY);


const uploadOnCloudinary = async (localFilePath) => {
    // console.log("inside cloud",localFilePath);
    try {
        if (!localFilePath) {
            
            
            return null}
        //upload the file on cloudinary
        try {
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
        } catch (error) {
            console.log(error);
        }
        
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        console.log('Attempting to unlink:', localFilePath);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the file is successfully uploaded on the cloud
        return response;

    } catch (error) {
        
        console.log("in catch");
        console.log(process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed.. so if the file is malecious or damaged it should not cause any harm to our local system
        return null;
    }
}



export {uploadOnCloudinary}


// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
    
//     // Upload the file to Cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: 'auto', // Automatically detect file type
//     });

//     // File uploaded successfully
//     console.log('File uploaded to Cloudinary:', response.url);

//     // Remove the local temporary file after upload
//     console.log('Attempting to unlink:', localFilePath);
//     fs.unlinkSync(localFilePath);

//     return response;
//   } catch (error) {
//     console.error('Error uploading to Cloudinary:', error);

//     // Ensure the file is deleted even if the upload fails
//     if (fs.existsSync(localFilePath)) {
//       console.log('Error occurred, removing local file:', localFilePath);
//       fs.unlinkSync(localFilePath);
//     }

//     return null;
//   }
// };

// export { uploadOnCloudinary };
