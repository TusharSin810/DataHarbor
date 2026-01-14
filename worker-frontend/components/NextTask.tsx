"use client"
import axios from "axios";
import { useEffect, useState } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Task {
    "id": number,
    "amount": number,
    "title": string,
    "options": {
        id: number,
        image_url: string,
        task_id: number
    }[]
}

export const NextTask = () => {
    
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading , setLoading] = useState(true);
    
    useEffect(() => {
        setLoading(true);
        axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
            headers:{
                "Authorization": localStorage.getItem("token")
            }
        })
            .then(res => {
                setCurrentTask(res.data.task);
                setLoading(false)
            })
    },[])

    if(loading){
        return <div> Loading... </div>
    }

    if(!currentTask){
        return <div>
            Please Check Back In Some Time , No Pending Task For You ;)
        </div>
    }

    return(
        <div>
            <div className="text-2xl pt-20 flex justify-center">
                {currentTask.title}
            </div>
            <div className="flex justify-center pt-8">
                {currentTask.options.map(option => <Option onSelect={async () => {
                    const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, {
                        taskId: currentTask.id,
                        selection: option.id
                    },{
                        headers: {
                            "Authorization": localStorage.getItem("token")
                        }
                    });
                    const nextTask = response.data.nextTask;

                    if(nextTask){
                        setCurrentTask(nextTask);
                    }else{
                        setCurrentTask(null);
                    }
 
                }} key={option.id} imageUrl={option.image_url}/>)}
            </div> 
        </div>
    )
}

function Option({imageUrl, onSelect}: {
    imageUrl: string;
    onSelect: () => void;
}){
    return(
        <div> 
            <img onClick={onSelect} className="p-2 w-96 rounded-md" src={imageUrl}/>
        </div>
    )
}