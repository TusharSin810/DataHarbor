import { Router } from "express";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import "dotenv";
import { workerAuthMiddleware } from "../middlewares/authmiddleware";
import { getNextTask } from "../nextTask";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

const workerRouter = Router();
const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/ch2xeAWYr9E6ShlCU3e2VI7wvh5dXXhj");

const TOTAL_SUBMISSIONS = 100;

const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET!;

const PRIVATE_KEY = process.env.PRIVATE_KEY!;

workerRouter.post("/payout", workerAuthMiddleware, async (req, res) => {
    //@ts-ignore
    const userId: string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })
    if(!worker){
        return res.status(403).json({
            message: "User Not Found"
        })
    }
    const addressW = worker.address;
    console.log(worker.pending_amount);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey("CDT8eif36PY45By4PgMiR5SY4y7Z3neXzrE1FSkCcZsE"),
            toPubkey: new PublicKey(addressW),
            lamports: worker.pending_amount
        })
    );
    transaction.feePayer = new PublicKey("CDT8eif36PY45By4PgMiR5SY4y7Z3neXzrE1FSkCcZsE");
    transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
    ).blockhash;
    
    console.log(transaction);

    const keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY))
    
      let signature: string;

      try {
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
        );
    
     } catch(e) {
        return res.json({
            message: "Transaction failed"
        })
     }
    
    console.log(signature)

    // Add A Lock Here

    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data: {
                worker_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        })

    })

    // Send Transaction To The BlockChain

    res.json({
        message: "Processing Payout",
        amount: worker.pending_amount
    })

})

workerRouter.get("/balance", workerAuthMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    
    const worker = await prismaClient.worker.findFirst({
        where: {
            id: userId
        }
    })
    res.json({
        pendingAmount : worker?.pending_amount,
        lockedAmount : worker?.locked_amount
    });
})

workerRouter.post("/submission", workerAuthMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;

    const parseBody = createSubmissionInput.safeParse(body);

    if(parseBody.success){
        const task = await getNextTask(userId);
        if(!task || task?.id !== Number(parseBody.data.taskId)){
            return res.status(400).json({
                message: "incorrect Task Id"
            })
        }

        const amount = (Number(task.amount)/TOTAL_SUBMISSIONS);

        const sub = await prismaClient.$transaction(async tx => {
            const submission = await tx.submission.create({
                data:{
                    option_id: Number(parseBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parseBody.data.taskId),
                    amount
                }
            })
            await tx.worker.update({
                where:{
                    id: userId,
                },
                data:{
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })
            return submission;
        })

        

        const nextTask = await getNextTask(userId);
        res.json({
            nextTask,
            amount
        })

    }else{
        res.status(411).json({
            message: "Incorrect Inputs"
        })
    }

})

workerRouter.get("/nextTask", workerAuthMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const task = await getNextTask(userId);
    if(!task){
      res.status(400).json({
        message:"No More Task Left For You To Review"
      })  
    }else{
        res.json({
            task
        })
    }
})

workerRouter.post("/signin", async (req, res) => {
    
    const {publicKey, signature, nonce} = req.body;

    const message = new TextEncoder().encode(nonce);
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    )
    
    const user = await prismaClient.worker.upsert({
        where:{
            address: publicKey
        },
        update: {},
        create: {
            address: publicKey,
            pending_amount: 0,
            locked_amount: 0
        },
    });

    const token = jwt.sign({userId: user.id}, WORKER_JWT_SECRET);

    res.json({
        token,
        amount: user.pending_amount,
    });

})

workerRouter.get("/auth/nonce", (req, res) => {
    const nonce = crypto.randomUUID();
    res.json({nonce});
})

export default workerRouter;