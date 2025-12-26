import express from "express";
import workerRouter from "./routers/worker";
import userRouter from "./routers/user";

const app = express();
const port = 3000;

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(port , () => {
    console.log(`Listening On Port : ${port}`)
});