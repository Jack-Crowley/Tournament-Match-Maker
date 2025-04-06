import { ChangeEvent, useState } from 'react';

export interface SkillField {
    name: string;
    type: "numeric" | "categorical";
    categories?: string[]; // Only for categorical skills
}

export const ModalList = ({ name, list, setList }: { name: string; list: SkillField[]; setList: (items: SkillField[]) => void }) => {
    const [newSkillName, setNewSkillName] = useState<string>("");
    const [newSkillType, setNewSkillType] = useState<"numeric" | "categorical">("numeric");
    const [newCategories, setNewCategories] = useState<string[]>([]);

    const handleAddSkill = () => {
        if (newSkillName.trim() === "") return;

        const newSkill: SkillField = {
            name: newSkillName,
            type: newSkillType,
            categories: newSkillType === "categorical" ? newCategories : undefined,
        };

        setList([...list, newSkill]);
        setNewSkillName("");
        setNewSkillType("numeric");
        setNewCategories([]);
    };

    return (
        <div>
            <label className="text-white block text-sm mb-2">{name}</label>
            <div className="space-y-4">
                {list.map((skill, index) => (
                    <div key={index} className="p-3 bg-[#2a2a2a] rounded-lg border border-[#3A3A3A]">
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                value={skill.name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    const updatedSkills = [...list];
                                    updatedSkills[index].name = e.target.value;
                                    setList(updatedSkills);
                                }}
                                className="w-full p-2 bg-[#252525] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                            />
                            <button
                                onClick={() => {
                                    const updatedSkills = list.filter((_, i) => i !== index);
                                    setList(updatedSkills);
                                }}
                                className="bg-red-500 text-white px-2 py-1 rounded ml-2"
                            >
                                Delete
                            </button>
                        </div>
                        <div className="mt-2">
                            <label className="text-white text-sm mr-2">Type:</label>
                            <select
                                value={skill.type}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                    const updatedSkills = [...list];
                                    updatedSkills[index].type = e.target.value as "numeric" | "categorical";
                                    if (updatedSkills[index].type === "categorical") {
                                        updatedSkills[index].categories = [];
                                    } else {
                                        delete updatedSkills[index].categories;
                                    }
                                    setList(updatedSkills);
                                }}
                                className="p-1 bg-[#2D2D2D] border border-[#7458da] text-white rounded"
                            >
                                <option value="numeric">Numeric</option>
                                <option value="categorical">Categorical</option>
                            </select>
                        </div>
                        {skill.type === "categorical" && (
                            <div className="mt-2">
                                <label className="text-white text-sm mb-1 block">Categories (ordered)</label>
                                {skill.categories?.map((category, catIndex) => (
                                    <div key={catIndex} className="flex items-center space-x-2 mb-1">
                                        <input
                                            type="text"
                                            value={category}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                const updatedSkills = [...list];
                                                updatedSkills[index].categories![catIndex] = e.target.value;
                                                setList(updatedSkills);
                                            }}
                                            className="w-full p-2 bg-[#252525] border-b-2 border-[#7458da] text-white focus:outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const updatedSkills = [...list];
                                                updatedSkills[index].categories = updatedSkills[index].categories!.filter((_, i) => i !== catIndex);
                                                setList(updatedSkills);
                                            }}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const updatedSkills = [...list];
                                        updatedSkills[index].categories!.push("");
                                        setList(updatedSkills);
                                    }}
                                    className="bg-green-500 text-white px-2 py-1 rounded mt-2"
                                >
                                    Add Category
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                <div className="p-3 bg-[#2a2a2a] rounded-lg border border-[#3A3A3A]">
                    <input
                        type="text"
                        value={newSkillName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkillName(e.target.value)}
                        placeholder="Enter skill name"
                        className="w-full p-2 bg-[#252525] border-b-2 border-[#7458da] text-white focus:outline-none"
                    />
                    <div className="mt-2">
                        <label className="text-white text-sm mr-2">Type:</label>
                        <select
                            value={newSkillType}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewSkillType(e.target.value as "numeric" | "categorical")}
                            className="p-1 bg-[#2D2D2D] border border-[#7458da] text-white rounded"
                        >
                            <option value="numeric">Numeric</option>
                            <option value="categorical">Categorical</option>
                        </select>
                    </div>
                    {newSkillType === "categorical" && (
                        <div className="mt-2">
                            <label className="text-white text-sm mb-1 block">Categories (ordered)</label>
                            {newCategories.map((category, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-1">
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            const updatedCategories = [...newCategories];
                                            updatedCategories[index] = e.target.value;
                                            setNewCategories(updatedCategories);
                                        }}
                                        className="w-full p-2 bg-[#252525] border-b-2 border-[#7458da] text-white focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            setNewCategories(newCategories.filter((_, i) => i !== index));
                                        }}
                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setNewCategories([...newCategories, ""])}
                                className="bg-green-500 text-white px-2 py-1 rounded mt-2"
                            >
                                Add Category
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleAddSkill}
                        className="bg-[#7458da] text-white px-3 py-2 rounded mt-3 w-full"
                    >
                        Add Skill
                    </button>
                </div>
            </div>
        </div>
    );
};
