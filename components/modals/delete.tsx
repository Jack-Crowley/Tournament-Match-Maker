import { AnimatePresence, motion } from "framer-motion"

export const DeleteModal = ({id, setId, handleDelete, word} : {word:string, id : string | null, handleDelete : (id : string) => void, setId : (state: string | null) => void}) => {
    return (
        <AnimatePresence>
            {id && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                    onClick={() => setId(null)}
                >
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        className="bg-[#1E1E1E] p-6 rounded-lg border border-primary shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4 text-white">Delete {word}</h2>
                        <p className="text-white mb-6">Are you sure you want to delete this {word.toLowerCase()}?</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setId(null)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(id)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}