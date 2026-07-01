"use client"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import axios from "axios"
import bs58 from "bs58"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const Appbar = () => {
    
    const {publicKey, signMessage} = useWallet();
    const [mounted , setMounted] = useState(false);
    async function signAndSend(){
        if(!publicKey){
            return;
        }
        const {nonce} = await axios.get(`${BACKEND_URL}/v1/user/auth/nonce`).then(r => r.data);
        const message = new TextEncoder().encode(nonce);
        const signature = await signMessage!(message);
        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
            signature: bs58.encode(signature),
            publicKey: publicKey?.toString(),
            nonce
        });
        localStorage.setItem("token", response.data.token);
        
    }
    useEffect(() => {
        signAndSend()
        setMounted(true);
        }, [publicKey]
    );

    return (
        <div className="flex justify-between border-b pb-2 pt-2">
            <div className="text-2xl pl-4 flex justify-center pt-3">
                DataHarbor
            </div>
            <div className="text-xl pr-4 pb-2">
                {mounted && (publicKey ? (<WalletDisconnectButton />) : (<WalletMultiButton />))}
            </div>
        </div>
    )
}