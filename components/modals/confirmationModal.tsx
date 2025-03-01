import { AnimatePresence, motion } from "framer-motion"

export interface ConfirmModalInformation {
    title : string,
    content : string,
    onCancel : () => void,
    onSuccess : () => void
}

export const ConfirmModal = ({information} : {information : ConfirmModalInformation | null}) => {
    return (
        <AnimatePresence>
            {information && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center p-4"
                    onClick={information.onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        className="bg-[#1E1E1E] p-6 rounded-lg border border-primary shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4 text-white">{information.title}</h2>
                        <p className="text-white mb-6">{information.content}</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={information.onCancel}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={information.onSuccess}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}