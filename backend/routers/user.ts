import { Router } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../db";
import { S3Client } from "@aws-sdk/client-s3";
import { authMiddleware } from "../middlewares/authmiddleware";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import "dotenv/config";

const userRouter = Router();
const JWT_SECRET = process.env.JWT_SCERET!;
const accessKey = String(process.env.ACCESS_KEY);
const secretKey = String(process.env.SECRET_KEY);
const s3Client = new S3Client({
    credentials:{
        accessKeyId: accessKey,
        secretAccessKey: secretKey
    },
    region: process.env.REGION
})

userRouter.get("/presignedUrl", authMiddleware, async (req, res) =>{
    //@ts-ignore
    const userId = req.userId;

    const {url, fields} = await createPresignedPost(s3Client, {
        Bucket: "decentralized-data-harbor",
        Key: `user-uploads/${userId}/${Math.random()}/image.jpg`,
        Conditions:[
            ['content-length-range', 0, 5*1024*1024]
        ],
        Fields:{
            success_action_status: '201',
            'Content-Type': 'image/jpg'
        },
        Expires: 3600        
    })

    console.log(url, fields);

    res.json({
        url,
        fields
    })

})

userRouter.post("/signin", async (req, res) => {
    const walletAddress = "CDT8eif36PY45By4PgMiR5SY4y7Z3neXzrE1FSkCcZsE"

    const user = await prismaClient.user.upsert({
        where:{
            address: walletAddress
        },
        update: {},
        create: {
            address: walletAddress,
        },
    });

    const token = jwt.sign({userId: user.id}, JWT_SECRET);

    res.json({token});

});

export default userRouter;