import { ChangeEvent, useState } from "react";

export const ModalList = ({name, list, setList}: {name:string, list : string[], setList : (items : string[]) => void}) => {
    const [newItem, setNewItem] = useState<string>("");

    return (
        <div>
            <label className="text-white block text-sm mb-2">{name}</label>
            <div className="space-y-4">
                {list.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={skill}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const updatedSkills = [...list];
                                updatedSkills[index] = e.target.value;
                                setList(updatedSkills);
                            }}
                            className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                        />
                        <button
                            onClick={() => {
                                const updatedSkills = list.filter((_, i) => i !== index);
                                setList(updatedSkills);
                            }}
                            className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                            Delete
                        </button>
                    </div>
                ))}
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem(e.target.value)}
                        placeholder="Add new skill field"
                        className="w-full p-2 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                    />
                    <button
                        onClick={() => {
                            if (newItem.trim() !== '') {
                                setList([...list, newItem]);
                                setNewItem('');
                            }
                        }}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    )
}