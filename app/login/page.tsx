import Link from 'next/link';

const LoginPage = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#160A3A]">
      <div className="w-full max-w-md p-8 bg-[#604BAC] rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold text-center text-[#fbfe9d] mb-6">Log in</h1>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="p-4 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-[#604BAC] text-black placeholder-gray-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            className="p-4 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-[#604BAC] text-black placeholder-gray-500 transition-colors"
          />
          
          <Link href="/account">
            <button
              type="button"
              className="mt-6 py-3 px-6 bg-[#7e67d2] text-white text-xl font-bold rounded-full hover:opacity-90 transition-opacity w-full"
            >
              Log in
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
