"use client"

import { useMessage } from "@/context/messageContext";
import { createClient } from "@/utils/supabase/client"

export default function Home() {
    const supabase = createClient()
    const {triggerMessage} = useMessage()

    async function testData() {
        const { data, error } = await supabase
            .from('tournaments')
            // .update({ owner: "b67edd11-d288-449d-9ee0-f10f44b97b30" })
            .update({name:"hi"})
            .eq('id', "187");

        if (error) {
            triggerMessage('Error updating tournament owner: '+ error.message, "red");
        } else {
            triggerMessage('Tournament updated: ' +data, "green");
        }
    }

    return (
        <div>
            <button onClick={testData} className="bg-highlight m-10 py-4 px-10 text-xl">Test Function</button>
        </div>
    )
}