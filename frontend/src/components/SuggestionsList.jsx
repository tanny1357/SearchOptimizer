function SuggestionsList({ suggestions, onSelect }) {
  if (suggestions.length === 0) return null;

  return (
    <ul className="absolute z-10 bg-white border rounded-md shadow mt-1 w-full max-w-lg text-black">
      {suggestions.map((s, index) => (
        <li
          key={index}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
          onClick={() => onSelect(s)}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

export default SuggestionsList;
