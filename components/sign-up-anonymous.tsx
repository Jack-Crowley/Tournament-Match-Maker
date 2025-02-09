import Link from "next/link"


export const SignUpToProceedScreen = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold mb-4">Sign In To View This Page</h1>
            <Link href={"/login"}>
                <button
                    className="bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                >
                    Sign On
                </button>
            </Link>
        </div>
    )
}