'use client'
import { Appbar } from '@/components/Appbar';
import axios from 'axios';
import { use, useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getTaskDetails(taskId: string) {
    const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
        headers: {
            "Authorization": localStorage.getItem("token")
        }
    })
    return response.data
}

export default function Page({
    params,
}:{
    params: Promise<{taskId: string}>;
}) {
    const {taskId} = use(params);
    const [result, setResult] = useState<Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }>>({});
    const [taskDetails, setTaskDetails] = useState<{
        title: string
    } | null>(null);

    useEffect(() => {
    const fetchData = async () => {
        const data = await getTaskDetails(taskId);
        setResult(data.result);
        setTaskDetails(data.taskDetails);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
    }, [taskId]);


    return <div>
        <Appbar />
        <div className='text-2xl pt-20 flex justify-center'>
            {taskDetails ? taskDetails.title : "Loading..."}
        </div>
        <div className='flex justify-center pt-8'>
            {Object.keys(result || {}).map(taskId => <Task key={result[taskId].option.imageUrl} imageUrl={result[taskId].option.imageUrl} votes={result[taskId].count} />)}
        </div>
    </div>
}

function Task({imageUrl, votes}: {
    imageUrl: string;
    votes: number;
}) {
    return <div>
        <img className={"p-2 w-96 rounded-md"} src={imageUrl} />
        <div className='flex justify-center'>
            {votes}
        </div>
    </div>
}