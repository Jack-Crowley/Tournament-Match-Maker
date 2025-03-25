import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward } from '@fortawesome/free-solid-svg-icons';
import { ChangeEvent, useState } from 'react';

interface SkillListProps {
    name: string;
    list: string[];
    setList: (list: string[]) => void;
}

export const ModalList = ({ name, list, setList }: SkillListProps) => {
    const [newItem, setNewItem] = useState<string>('');

    const addItem = () => {
        if (newItem.trim() !== '') {
            setList([...list, newItem]);
            setNewItem('');
        }
    };

    const removeItem = (index: number) => {
        const updatedItems = list.filter((_, i) => i !== index);
        setList(updatedItems);
    };

    return (
        <div className="p-4 bg-[#252525] rounded-lg border border-[#3A3A3A]">
            <div className="flex items-center mb-3">
                <FontAwesomeIcon icon={faAward} className="mr-2 text-[#7458da]" />
                <h3 className="text-white font-medium">{name}</h3>
            </div>
            
            <div className="flex mb-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem(e.target.value)}
                    placeholder="ELO..."
                    className="flex-grow p-2 bg-[#2a2a2a] rounded-l-md text-white focus:outline-none"
                />
                <button
                    onClick={addItem}
                    className="bg-[#7458da] hover:bg-[#604BAC] text-white px-3 rounded-r-md transition-colors"
                    disabled={!newItem.trim()}
                >
                    Add
                </button>
            </div>
            
            {list.length > 0 && (
                <ul className="space-y-1">
                    {list.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-[#2a2a2a] p-2 rounded">
                            <input
                                type="text"
                                value={item}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    const updatedItems = [...list];
                                    updatedItems[index] = e.target.value;
                                    setList(updatedItems);
                                }}
                                className="flex-grow bg-[#2a2a2a] text-white focus:outline-none focus:border-b border-[#7458da]"
                            />
                            <button
                                onClick={() => removeItem(index)}
                                className="text-red-400 hover:text-red-300 ml-2"
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};