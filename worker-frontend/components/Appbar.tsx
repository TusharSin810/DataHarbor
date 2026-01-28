'use client'

import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { headers } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const Appbar = () => {
    
    const {publicKey, signMessage} = useWallet();
    const [balance, setBalance] = useState(0);
    async function signAndSend(){
        if(!publicKey){
            return;
        }
        const {nonce} = await axios.get(`${BACKEND_URL}/v1/worker/auth/nonce`).then(r => r.data);
        const message = new TextEncoder().encode(nonce);
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
            signature,
            publicKey: publicKey?.toString(),
            nonce
        });

        setBalance(response.data.amount/1000_000_000);
        localStorage.setItem("token", response.data.token);
        
    }
    useEffect(() => {
            signAndSend()
    }, [publicKey]);
    

    return (
        <div className="flex justify-between border-b pb-2 pt-2">
            <div className="text-2xl pl-4 flex justify-center pt-3">
                DataHarbor (WORKER)
            </div>
            <div className="text-xl pr-4 pb-2 flex">
                <button onClick={() => {
                    axios.post(`${BACKEND_URL}/v1/worker/payout`,{
                        headers: {
                            "Authorization": localStorage.getItem("token")
                        }
                    })
                }} className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-sm text-sm px-5 py-2 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Pay Out: ({balance}) SOL</button>
                {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
            </div>
        </div>
    )
}