import { Router } from "express";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import "dotenv";
import { workerAuthMiddleware } from "../middlewares/authmiddleware";
import { getNextTask } from "../nextTask";
import { createSubmissionInput } from "../types";

const workerRouter = Router();

const TOTAL_SUBMISSIONS = 100;

const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET!;


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
    const address = worker.address;
    const txnId = "0x123123123";

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
                signature: txnId
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

    const walletAddress = "8nnue5nCErEsWfx9SRv3LQzcQc2pnRhb4VRp3iXLhx6p"
    const user = await prismaClient.worker.upsert({
        where:{
            address: walletAddress
        },
        update: {},
        create: {
            address: walletAddress,
            pending_amount: 0,
            locked_amount: 0
        },
    });

    const token = jwt.sign({userId: user.id}, WORKER_JWT_SECRET);

    res.json({token});

})

export default workerRouter;