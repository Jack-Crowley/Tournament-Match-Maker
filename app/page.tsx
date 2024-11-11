

// I am not entirely sure what this does...
// Difference between client and server components
// Requires research
'use client';

// How to handle this typescript error?
//! "Binding element 'handleClick' implicitly has an 'any' type.ts(7031)"
export function HelloWorld({handleClick}) {
  return (
    <div className = "text-center self-center">
      <button onClick={handleClick}>Hello World!</button>
    </div>
  )
}

const handleHelloWorldClick = () => {
  alert("TODO: Put something in the database")
};

export default function Home() {
  return <HelloWorld handleClick={handleHelloWorldClick}/>
}
