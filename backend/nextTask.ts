import { prismaClient } from "./db"

export const getNextTask = async (userId: number) => {
    
    const task = await prismaClient.task.findFirst({
    where: {
        done: false,
        submissions: {
            none: {
                worker_id: userId,
            }
        }
    },
    select:{
        id: true,
        title: true,
        options: true,
        amount: true
    }
})
return task
}