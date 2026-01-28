import { Router } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../db";
import { S3Client } from "@aws-sdk/client-s3";
import { userAuthMiddleware } from "../middlewares/authmiddleware";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import "dotenv/config";
import { createTaskInput } from "../types";
import nacl from "tweetnacl"
import { Connection, PublicKey } from "@solana/web3.js";

const TOTAL_DECIMALS = 1000_000_000;
const userRouter = Router();
const USER_JWT_SECRET = process.env.USER_JWT_SECRET!;
const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;
const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/ch2xeAWYr9E6ShlCU3e2VI7wvh5dXXhj");
const accessKey = String(process.env.ACCESS_KEY);
const secretKey = String(process.env.SECRET_KEY);
const s3Client = new S3Client({
    credentials:{
        accessKeyId: accessKey,
        secretAccessKey: secretKey
    },
    region: process.env.REGION
})

userRouter.get("/task", userAuthMiddleware, async (req, res) => {
    //@ts-ignore
    const taskId: string = req.query.taskId;
    //@ts-ignore
    const userId: string = req.userId;
    
    const taskDetails = await prismaClient.task.findFirst({
        where:{
            user_id: Number(userId),
            id: Number(taskId)
        },
        include:{
            options: true
        }
    })

    if(!taskDetails){
        return res.status(400).json({
            message: "You Dont Have Access To This Task"
        })
    }

    const responses = await prismaClient.submission.findMany({
        where:{
            task_id: Number(taskId)
        },
        include:{
            options: true
        }
    });

    const result: Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        }
    })

    responses.forEach(r => {
        result[r.option_id]!.count++;
    });
    
    res.json({
        result,
        taskDetails
    })

})

userRouter.post("/task", userAuthMiddleware , async (req, res) => {
    //@ts-ignore
    const userId = req.userId
    const body = req.body;
    const parseData = createTaskInput.safeParse(body);

    const user = await prismaClient.user.findFirst({
        where:{
            id: userId
        }
    })

    if(!parseData.success){
       return res.status(400).json({
            message: "Invalid Inputs"
        })
    }

    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    if((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100_000_000){
        return(
            res.status(411).json({
                message: "Transaction Signature/Amount Incorrect"
            })
        )
    }

    if((transaction?.transaction?.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS)){
        return(
            res.status(411).json({
                message: "Transaction Sent Is Wrong"
            })
        )
    }

    if((transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address)){
        return(
            res.status(411).json({
                message: "Trsansaction Send From Wrong Address"
            })
        )
    }

    let response = await prismaClient.$transaction(async tx => {
       const task = await tx.task.create({
            data:{
                title: parseData.data.title,
                amount: 0.1 * TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId
            }
        });
    
        await tx.options.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: task.id, 
            }))
        })
        return task;
    })
    res.json({
        id: response.id
    })

})

userRouter.get("/presignedUrl", userAuthMiddleware , async (req, res) =>{
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

    const {publicKey, signature, nonce} = req.body;
    const message = new TextEncoder().encode(nonce);
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    )

    const user = await prismaClient.user.upsert({
        where:{
            address: publicKey
        },
        update: {},
        create: {
            address: publicKey,
        },
    });

    const token = jwt.sign({userId: user.id}, USER_JWT_SECRET);
    res.json({token});

});

userRouter.get("/auth/nonce", (req, res) => {
    const nonce = crypto.randomUUID();
    res.json({nonce});
})

export default userRouter;