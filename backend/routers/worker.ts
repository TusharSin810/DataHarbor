import { Router } from "express";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import "dotenv";

const workerRouter = Router();

const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET!;

workerRouter.post("/signin", async (req, res) => {

    const walletAddress = "CDT8eif36PY45By4PgMiR5SY4y7Z3neXzrE1FSkCcZsE"
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