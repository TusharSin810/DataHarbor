import { Router } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../db";

const userRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

userRouter.post("/signin", async (req, res) => {
    const walletAddress = "CDT8eif36PY45By4PgMiR5SY4y7Z3neXzrE1FSkCcZsE"

    const existingUser = await prismaClient.user.findFirst({
        where:{
            address: walletAddress
        }
    })

    if(existingUser) {

        const token = jwt.sign({
            userId: existingUser.id
        }, JWT_SECRET)
        res.json({
            token: token
        });
    }else{
        const user = await prismaClient.user.create({
            data:{
                address: walletAddress,
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)
        res.json({
            token: token
        });
    }
});

export default userRouter;