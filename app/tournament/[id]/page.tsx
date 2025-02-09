"use client"

import Initialization from "./initialization"
import Join from "./join"
import { useSearchParams } from "next/navigation";

export default function Home() {
    const searchParams = useSearchParams();
    const hasJoinParam = searchParams.has("join");

    return (
        <div>
            {hasJoinParam ? (
                <Join />
            ) : (
                <Initialization />
            )}
        </div>
    )
}