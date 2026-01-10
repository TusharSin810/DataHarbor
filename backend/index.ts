import express from "express";
import workerRouter from "./routers/worker";
import userRouter from "./routers/user";
import cors from "cors";

const app = express();
const port = 4000;

app.use(express.json())
app.use(cors())

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(port , () => {
    console.log(`Listening On Port : ${port}`)
});